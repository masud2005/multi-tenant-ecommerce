import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerFaqService } from './faq.service';

@ApiTags('(Customer/Public) FAQs')
@Controller('customer/faq')
export class CustomerFaqController {
  constructor(private readonly faqService: CustomerFaqService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all public FAQs for the store' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (e.g. Orders, Delivery, Returns, Account)' })
  @ApiResponse({ status: 200, description: 'FAQs retrieved successfully' })
  async getFaqs(
    @Query('category') category?: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.faqService.getFaqs(tenantHeader, category);
  }
}
