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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../../prisma/generated/client';

@ApiTags('Live Chat & Messages')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 1. 🏢 Owner/Staff: Get decrypted message history for a conversation
   */
  @Get('owner/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get decrypted message history for a conversation (Owner/Staff)' })
  async getOwnerChatHistory(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    return this.chatService.getChatHistory(conversationId, 'OWNER', tenantId);
  }

  /**
   * 2. 🏢 Owner/Staff: Send encrypted reply message to conversation
   */
  @Post('owner/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send encrypted reply message from Store Owner or Staff' })
  async sendOwnerMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    const senderRole = user?.isOwner ? 'OWNER' : 'STAFF';
    const senderName = user?.name || (user?.isOwner ? 'Store Owner' : 'Store Staff');
    return this.chatService.saveMessage(
      conversationId,
      dto,
      { id: user?.id, name: senderName, role: senderRole },
      tenantId,
    );
  }

  /**
   * 3. 🛍️ Customer/Guest: Get decrypted message history for storefront chat widget
   */
  @Get('customer/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get decrypted message history for customer storefront widget' })
  async getCustomerChatHistory(
    @Param('id') conversationId: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.chatService.getChatHistory(conversationId, 'CUSTOMER', tenantHeader);
  }

  /**
   * 4. 🛍️ Customer/Guest: Send encrypted message from storefront chat widget
   */
  @Post('customer/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send encrypted message from Customer storefront widget' })
  async sendCustomerMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const customerName = dto.senderName || user?.name || 'Customer';
    return this.chatService.saveMessage(
      conversationId,
      dto,
      { id: user?.id, name: customerName, role: 'CUSTOMER' },
      tenantHeader,
    );
  }
}
