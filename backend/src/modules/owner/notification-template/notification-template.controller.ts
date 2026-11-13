import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerNotificationTemplateService } from './notification-template.service';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Notification Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner/notification-templates')
export class OwnerNotificationTemplateController {
  constructor(
    private readonly templateService: OwnerNotificationTemplateService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List store notification event templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async list(@CurrentUser() user?: AuthUser) {
    return this.templateService.list(user?.tenantId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one notification template' })
  async getOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.templateService.getOne(id, user?.tenantId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update template channels and message content',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.templateService.update(id, dto, user?.tenantId);
  }
}
