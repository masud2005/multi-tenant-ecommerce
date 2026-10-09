import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('(Customer) Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customer/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all saved delivery addresses for current customer' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAddresses(@CurrentUser() user?: any) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to view addresses');
    }
    return this.addressService.getAddresses(userId, user?.tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a new delivery address for current customer' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to save address');
    }
    return this.addressService.createAddress(userId, dto, user?.tenantId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing delivery address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to update address');
    }
    return this.addressService.updateAddress(userId, id, dto, user?.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to delete address');
    }
    return this.addressService.deleteAddress(userId, id, user?.tenantId);
  }
}
