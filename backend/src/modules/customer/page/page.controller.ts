import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerPageService } from './page.service';

@ApiTags('(Customer/Public) CMS Pages')
@Controller('customer/pages')
export class CustomerPageController {
  constructor(private readonly pageService: CustomerPageService) {}

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public CMS page content by slug (e.g. about)' })
  @ApiParam({ name: 'slug', description: 'Page slug, e.g. about', example: 'about' })
  @ApiResponse({ status: 200, description: 'Page content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPage(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantHeader?: string
  ) {
    return this.pageService.getPageBySlug(slug, tenantHeader);
  }
}
