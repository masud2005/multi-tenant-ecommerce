import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
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
import { SettingsService } from './settings.service';
import { UpdateStoreSettingsDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Store Settings')
@Controller('owner/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // 1. Get current tenant store configuration & contact details
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get store identity, contact info, working hours, and configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Store settings retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getStoreSettings(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.settingsService.getStoreSettings(tenantId);
  }

  // 2. Update store settings, branding, public contact details & working hours
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update store details, contact info (email, whatsapp, phone, address, hours)',
  })
  @ApiResponse({
    status: 200,
    description: 'Store settings updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async updateStoreSettings(
    @Body() dto: UpdateStoreSettingsDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.settingsService.updateStoreSettings(dto, tenantId);
  }

  // 3. Upload / replace store logo
  @Patch('logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Store logo image file',
        },
      },
      required: ['logo'],
    },
  })
  @ApiOperation({ summary: 'Upload or replace the store logo image' })
  @ApiResponse({ status: 200, description: 'Store logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing image file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.settingsService.uploadLogo(file, tenantId);
  }

  // 4. Remove store logo
  @Delete('logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove the store logo (storefront falls back to name)' })
  @ApiResponse({ status: 200, description: 'Store logo removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async removeLogo(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.settingsService.removeLogo(tenantId);
  }
}
