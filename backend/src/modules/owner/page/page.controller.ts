import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerPageService } from './page.service';
import { UpdateAboutPageDto, UpdateReturnsPageDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) CMS Pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner/pages')
export class OwnerPageController {
  constructor(private readonly pageService: OwnerPageService) {}

  @Get('about')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get About Us page content for editing' })
  @ApiResponse({ status: 200, description: 'About Us page retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getAboutPage(@CurrentUser() user?: any) {
    return this.pageService.getAboutPage(user?.tenantId);
  }

  @Put('about')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or save About Us page content' })
  @ApiResponse({ status: 200, description: 'About Us page saved successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async updateAboutPage(
    @Body() dto: UpdateAboutPageDto,
    @CurrentUser() user?: any
  ) {
    const authorName = user?.name || user?.email || 'Store Admin';
    return this.pageService.updateAboutPage(dto, user?.tenantId, authorName);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all CMS pages for owner dashboard' })
  @ApiResponse({ status: 200, description: 'Pages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getAllPages(@CurrentUser() user?: any) {
    return this.pageService.getAllPages(user?.tenantId);
  }

  @Get('returns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Return page content for editing' })
  @ApiResponse({ status: 200, description: 'Return page retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getReturnsPage(@CurrentUser() user?: any) {
    return this.pageService.getReturnsPage(user?.tenantId);
  }

  @Put('returns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or save Return page content' })
  @ApiResponse({ status: 200, description: 'Return page saved successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async updateReturnsPage(
    @Body() dto: UpdateReturnsPageDto,
    @CurrentUser() user?: any
  ) {
    const authorName = user?.name || user?.email || 'Store Admin';
    return this.pageService.updateReturnsPage(dto, user?.tenantId, authorName);
  }
}

