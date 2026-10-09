import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerSupportService } from './support.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';

@ApiTags('(Customer) Support & Contact')
@Controller('customer/contact')
export class CustomerSupportController {
  constructor(private readonly supportService: CustomerSupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Submit a new customer contact / support inquiry message',
  })
  @ApiResponse({
    status: 201,
    description: 'Support message created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid form input' })
  async createContactMessage(
    @Body() dto: CreateContactMessageDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    const userId = user?.id || user?.sub;
    return this.supportService.createContactMessage(dto, tenantId, userId);
  }
}
