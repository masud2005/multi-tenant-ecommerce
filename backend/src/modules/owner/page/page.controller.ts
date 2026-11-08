import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerPageService, POLICY_SLUGS } from './page.service';
import {
  UpdateAboutPageDto,
  UpdatePolicyPageDto,
  UpdateReturnsPageDto,
} from './dto';
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
  async getAboutPage(@CurrentUser() user?: any) {
    return this.pageService.getAboutPage(user?.tenantId);
  }

  @Put('about')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or save About Us page content' })
  async updateAboutPage(
    @Body() dto: UpdateAboutPageDto,
    @CurrentUser() user?: any,
  ) {
    const authorName = user?.name || user?.email || 'Store Admin';
    return this.pageService.updateAboutPage(dto, user?.tenantId, authorName);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all CMS pages for owner dashboard' })
  async getAllPages(@CurrentUser() user?: any) {
    return this.pageService.getAllPages(user?.tenantId);
  }

  @Get('policies/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Get policy page (${POLICY_SLUGS.join(', ')}) for editing`,
  })
  @ApiParam({ name: 'slug', example: 'shipping' })
  async getPolicyPage(
    @Param('slug') slug: string,
    @CurrentUser() user?: any,
  ) {
    return this.pageService.getPolicyPage(slug, user?.tenantId);
  }

  @Put('policies/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Update policy page (${POLICY_SLUGS.join(', ')})`,
  })
  @ApiParam({ name: 'slug', example: 'shipping' })
  async updatePolicyPage(
    @Param('slug') slug: string,
    @Body() dto: UpdatePolicyPageDto,
    @CurrentUser() user?: any,
  ) {
    const authorName = user?.name || user?.email || 'Store Admin';
    return this.pageService.updatePolicyPage(
      slug,
      dto,
      user?.tenantId,
      authorName,
    );
  }

  /** Back-compat aliases for returns */
  @Get('returns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Return page (alias of policies/returns)' })
  async getReturnsPage(@CurrentUser() user?: any) {
    return this.pageService.getPolicyPage('returns', user?.tenantId);
  }

  @Put('returns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Return page (alias of policies/returns)' })
  async updateReturnsPage(
    @Body() dto: UpdateReturnsPageDto,
    @CurrentUser() user?: any,
  ) {
    const authorName = user?.name || user?.email || 'Store Admin';
    return this.pageService.updatePolicyPage(
      'returns',
      dto,
      user?.tenantId,
      authorName,
    );
  }
}
