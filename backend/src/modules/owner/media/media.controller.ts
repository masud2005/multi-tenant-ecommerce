import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { QueryMediaDto } from './dto/query-media.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Media Library')
@Controller('owner/media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List store media assets with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Media assets retrieved successfully' })
  async getMedia(
    @Query() query: QueryMediaDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.mediaService.getMedia(query, tenantId);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (PNG, JPG, WebP, AVIF, GIF · max 5MB)',
        },
        alt: {
          type: 'string',
          description: 'Optional accessibility alt text',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload an image file to Cloudinary media library' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  async uploadMediaFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('alt') alt?: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.mediaService.uploadMediaFile(file, alt, tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save new media asset record' })
  @ApiResponse({ status: 201, description: 'Media asset created successfully' })
  async createMedia(
    @Body() dto: CreateMediaDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.mediaService.createMedia(dto, tenantId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update media asset alt text or title' })
  @ApiResponse({ status: 200, description: 'Media asset updated successfully' })
  async updateMedia(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.mediaService.updateMedia(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete media asset from library' })
  @ApiResponse({ status: 200, description: 'Media asset deleted successfully' })
  async deleteMedia(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.mediaService.deleteMedia(id, tenantId);
  }
}

