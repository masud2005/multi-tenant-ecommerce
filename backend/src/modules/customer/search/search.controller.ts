import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { LogSearchDto } from './dto/log-search.dto';
import { LogClickDto } from './dto/log-click.dto';

@ApiTags('(Customer) Search')
@Controller('customer/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('log')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log customer search query for analytics and inventory demand detection',
  })
  @ApiResponse({ status: 200, description: 'Search logged successfully' })
  async logSearch(
    @Body() dto: LogSearchDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.searchService.logSearch(dto, tenantHeader, authHeader);
  }

  @Post('click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log product click resulting from a search query',
  })
  @ApiResponse({ status: 200, description: 'Product click logged successfully' })
  async logClick(
    @Body() dto: LogClickDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.searchService.logClick(dto, tenantHeader, authHeader);
  }
}

