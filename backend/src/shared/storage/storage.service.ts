import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';
import {
  DeleteResult,
  UploadOptions,
  UploadResult,
} from './interfaces/storage.interface';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary credentials are not fully set in environment. File uploads to Cloudinary will fail until configured.',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    this.logger.log(`Cloudinary storage service initialized for cloud: ${cloudName}`);
  }

  async uploadFile(
    file: Express.Multer.File | Buffer | string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    this.ensureConfigured();

    const uploadOptions: UploadApiOptions = {
      folder: options?.folder || 'uploads',
      resource_type: options?.resourceType || 'auto',
      overwrite: options?.overwrite ?? true,
      tags: options?.tags,
      transformation: options?.transformation,
    };

    if (options?.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (typeof file === 'string') {
      return this.uploadString(file, uploadOptions);
    }

    if (this.isMulterFile(file)) {
      if (!file.buffer) {
        throw new BadRequestException('Uploaded file buffer is empty');
      }
      return this.uploadBuffer(file.buffer, uploadOptions, file.originalname);
    }

    if (Buffer.isBuffer(file)) {
      return this.uploadBuffer(file, uploadOptions);
    }

    throw new BadRequestException('Invalid file format provided for upload');
  }

  async uploadFiles(
    files: (Express.Multer.File | Buffer | string)[],
    options?: UploadOptions,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      return [];
    }
    return Promise.all(files.map((file) => this.uploadFile(file, options)));
  }

  async uploadFromUrl(
    url: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return this.uploadFile(url, options);
  }

  async deleteFile(
    publicIdOrUrl: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<DeleteResult> {
    this.ensureConfigured();

    const publicId = this.extractPublicId(publicIdOrUrl);
    if (!publicId) {
      throw new BadRequestException('Invalid public_id or Cloudinary URL');
    }

    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      return {
        publicId,
        result: response.result,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${publicId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        error.message || 'Cloudinary file deletion failed',
      );
    }
  }

  async deleteFiles(
    publicIdsOrUrls: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<DeleteResult[]> {
    if (!publicIdsOrUrls || publicIdsOrUrls.length === 0) {
      return [];
    }
    return Promise.all(
      publicIdsOrUrls.map((item) => this.deleteFile(item, resourceType)),
    );
  }

  getOptimizedUrl(
    publicIdOrUrl: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: 'webp' | 'avif' | 'auto' | 'png' | 'jpg';
    },
  ): string {
    const publicId = this.extractPublicId(publicIdOrUrl);
    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: transformations?.format || 'auto',
      quality: transformations?.quality || 'auto',
      width: transformations?.width,
      height: transformations?.height,
      crop: transformations?.crop || (transformations?.width ? 'limit' : undefined),
    });
  }

  extractPublicId(publicIdOrUrl: string): string {
    if (!publicIdOrUrl) return '';

    // If it's not a URL, return directly
    if (!publicIdOrUrl.startsWith('http://') && !publicIdOrUrl.startsWith('https://')) {
      return publicIdOrUrl;
    }

    try {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v1612345678/folder/sample.jpg
      const url = new URL(publicIdOrUrl);
      const parts = url.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');

      if (uploadIndex === -1) {
        return publicIdOrUrl;
      }

      // Everything after /upload/ and optional version (v123456/)
      let publicIdParts = parts.slice(uploadIndex + 1);
      if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
        publicIdParts = publicIdParts.slice(1);
      }

      const fullPathWithExt = publicIdParts.join('/');
      // Remove file extension
      const lastDot = fullPathWithExt.lastIndexOf('.');
      return lastDot !== -1 ? fullPathWithExt.substring(0, lastDot) : fullPathWithExt;
    } catch {
      return publicIdOrUrl;
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    uploadOptions: UploadApiOptions,
    originalFilename?: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            this.logger.error(
              'Cloudinary buffer upload error',
              error?.message || error,
            );
            return reject(
              new InternalServerErrorException(
                error?.message || 'Cloudinary upload stream failed',
              ),
            );
          }
          resolve(this.mapUploadResponse(result, originalFilename));
        },
      );

      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  private async uploadString(
    fileStr: string,
    uploadOptions: UploadApiOptions,
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(fileStr, uploadOptions);
      return this.mapUploadResponse(result);
    } catch (error: any) {
      this.logger.error(
        'Cloudinary string/url upload error',
        error.message || error,
      );
      throw new InternalServerErrorException(
        error.message || 'Cloudinary upload failed',
      );
    }
  }

  private mapUploadResponse(
    result: UploadApiResponse,
    originalFilename?: string,
  ): UploadResult {
    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      originalFilename: originalFilename || result.original_filename,
      createdAt: result.created_at,
    };
  }

  private isMulterFile(file: any): file is Express.Multer.File {
    return file && typeof file === 'object' && 'buffer' in file;
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      // Re-check in case credentials were set after init
      const cloudName = this.configService.get<string>('cloudinary.cloudName');
      const apiKey = this.configService.get<string>('cloudinary.apiKey');
      const apiSecret = this.configService.get<string>('cloudinary.apiSecret');

      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });
        this.isConfigured = true;
        return;
      }

      throw new InternalServerErrorException(
        'Cloudinary is not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.',
      );
    }
  }
}
