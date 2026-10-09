import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerSupportService } from './support.service';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Support Tickets & Messages')
@Controller('owner/support/tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class OwnerSupportController {
  constructor(private readonly supportService: OwnerSupportService) {}

  // 1. List all customer support tickets
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List customer inquiries, messages and support tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getTickets(
    @Query() query: TicketQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.getTickets(query, tenantId);
  }

  // 2. Get single ticket with full message history
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single ticket details with full conversation thread' })
  @ApiResponse({ status: 200, description: 'Ticket details retrieved successfully' })
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.getTicketById(id, tenantId);
  }

  // 3. Post reply message to ticket
  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reply to customer support ticket' })
  @ApiResponse({ status: 200, description: 'Reply posted successfully' })
  async replyToTicket(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.replyToTicket(id, dto, tenantId, user);
  }

  // 4. Update status of a support ticket
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update ticket status (open, pending, resolved, closed)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.supportService.updateTicketStatus(id, dto, tenantId);
  }
}
