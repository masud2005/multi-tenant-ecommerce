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
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../../prisma/generated/client';

@ApiTags('Live Chat & Messages')
@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * 🛍️ 1. Customer: Start or resume live chat session
   */
  @Post('customer/chat/init')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Initialize or resume customer live chat conversation' })
  async initCustomerChat(
    @Body() dto: StartConversationDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.chatService.initConversation(dto, user, tenantHeader);
  }

  /**
   * 🛍️ 2. Customer: Get decrypted message history for storefront chat widget
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
   * 🛍️ 3. Customer: Send message from storefront chat widget
   */
  @Post('customer/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Send message from Customer storefront widget' })
  async sendCustomerMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const customerName = dto.senderName || user?.name || 'Customer';
    const result = await this.chatService.saveMessage(
      conversationId,
      dto,
      { id: user?.id, name: customerName, role: 'CUSTOMER' },
      tenantHeader,
    );
    this.chatGateway.broadcastMessage(conversationId, result.data);
    return result;
  }

  /**
   * 🛍️ 4. Customer: Mark conversation messages as read
   */
  @Patch('customer/chat/conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark customer conversation as read' })
  async markCustomerRead(
    @Param('id') conversationId: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.chatService.markAsRead(conversationId, 'CUSTOMER', tenantHeader);
  }

  /**
   * 🏢 5. Owner/Staff: Get conversations list with decrypted last message previews
   */
  @Get('owner/chat/conversations')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get owner conversations list with decrypted last messages' })
  async getOwnerConversations(
    @Query() query: ConversationQueryDto,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    return this.chatService.getOwnerConversations(query, tenantId);
  }

  /**
   * 🏢 6. Owner/Staff: Get decrypted message history for a conversation
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
   * 🏢 7. Owner/Staff: Send reply message to conversation
   */
  @Post('owner/chat/conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send reply message from Store Owner or Staff' })
  async sendOwnerMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    const senderRole = user?.isOwner ? 'OWNER' : 'STAFF';
    const senderName = user?.name || (user?.isOwner ? 'Store Owner' : 'Store Staff');
    const result = await this.chatService.saveMessage(
      conversationId,
      dto,
      { id: user?.id, name: senderName, role: senderRole },
      tenantId,
    );
    this.chatGateway.broadcastMessage(conversationId, result.data);
    return result;
  }

  /**
   * 🏢 8. Owner/Staff: Mark conversation as read
   */
  @Patch('owner/chat/conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Mark conversation as read by owner' })
  async markOwnerRead(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    return this.chatService.markAsRead(conversationId, 'OWNER', tenantId);
  }

  /**
   * 🏢 9. Owner/Staff: Update conversation status (active, resolved, archived)
   */
  @Patch('owner/chat/conversations/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update conversation status' })
  async updateOwnerConversationStatus(
    @Param('id') conversationId: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    return this.chatService.updateStatus(conversationId, status, tenantId);
  }
}
