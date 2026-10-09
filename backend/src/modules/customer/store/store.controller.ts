import { Controller, Get, Headers, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreService } from './store.service';

@ApiTags('(Customer) Store Info')
@Controller('customer/store-info')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // 1. Public endpoint to retrieve store details, public contact info & working hours
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get public store information, contact details, address, hours, and branding',
  })
  @ApiResponse({
    status: 200,
    description: 'Store public info retrieved successfully',
  })
  async getPublicStoreInfo(
    @Headers('x-tenant-id') tenantHeader?: string,
    @Query('slug') slugQuery?: string,
  ) {
    const identifier = tenantHeader || slugQuery;
    return this.storeService.getPublicStoreInfo(identifier);
  }
}
