import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
}
