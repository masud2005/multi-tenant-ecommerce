import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerSupportService } from './support.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

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

  @Get('tickets')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all support tickets for current customer' })
  @ApiResponse({ status: 200, description: 'Customer tickets retrieved successfully' })
  async getCustomerTickets(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.getCustomerTickets(tenantId, user);
  }

  @Post('tickets/:id/reply')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Customer reply to a support ticket' })
  @ApiResponse({ status: 201, description: 'Reply posted successfully' })
  async replyCustomerTicket(
    @Param('id') id: string,
    @Body() body: { text: string },
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.replyCustomerTicket(id, body.text, tenantId, user);
  }
}
