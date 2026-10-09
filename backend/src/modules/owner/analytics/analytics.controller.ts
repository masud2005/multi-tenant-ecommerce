import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Analytics')
@Controller('owner/analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 1. Get Sales by District (Real Database Aggregation)
  @Get('sales-by-district')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get real sales aggregation grouped by district from order database',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales by district retrieved successfully',
  })
  async getSalesByDistrict(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.analyticsService.getSalesByDistrict(query.range, tenantId);
  }

  // 2. Get Full Analytics Overview (Real KPIs, timeline, district, and payment breakdown)
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full store analytics with real database calculations',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview retrieved successfully',
  })
  async getAnalyticsOverview(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.analyticsService.getAnalyticsOverview(query.range, tenantId);
  }

  // 3. Get Real Top Searches from PostgreSQL
  @Get('top-searches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get top customer search queries and zero-result search metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Top searches retrieved successfully',
  })
  async getTopSearches(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.analyticsService.getTopSearches(tenantId);
  }
}
