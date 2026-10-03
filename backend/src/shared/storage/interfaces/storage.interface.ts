export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any;
  overwrite?: boolean;
}

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  originalFilename?: string;
  createdAt: string;
}

export interface DeleteResult {
  publicId: string;
  result: 'ok' | 'not found' | string;
}
