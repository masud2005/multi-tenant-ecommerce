import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user notifications & unread count' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Query() query: QueryNotificationDto,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    const tenantId = tenantHeader || user?.tenantId;
    return this.notificationService.getUserNotifications(userId, tenantId, query);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    const tenantId = tenantHeader || user?.tenantId;
    return this.notificationService.markAsRead(id, userId, tenantId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    const tenantId = tenantHeader || user?.tenantId;
    return this.notificationService.markAllAsRead(userId, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    const tenantId = tenantHeader || user?.tenantId;
    return this.notificationService.deleteNotification(id, userId, tenantId);
  }
}
