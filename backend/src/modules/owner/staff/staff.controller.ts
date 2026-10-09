import {
  Body,
  Controller,
  Delete,
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
import { StaffService } from './staff.service';
import {
  QueryStaffDto,
  InviteStaffDto,
  UpdateStaffDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Staff & Roles')
@Controller('owner/staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // 1. Get all store staff members with search, filters, pagination, and role metadata
  @Get('members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all store staff members with role permissions and status counters',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff members retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Store owner role required',
  })
  async getStaffMembers(
    @Query() query: QueryStaffDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.getStaffMembers(query, tenantId);
  }

  // 2. Invite or add a new staff member and assign role permissions
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite or add a new staff member and assign store role',
  })
  @ApiResponse({
    status: 201,
    description: 'Staff member invited/added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or user already member',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Store owner role required',
  })
  async inviteStaff(
    @Body() dto: InviteStaffDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.inviteStaff(dto, tenantId, user);
  }

  // 2b. Resend invitation email to an invited staff member
  @Post('members/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend invitation email to a pending staff member',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation email resent successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  async resendInvite(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.resendInvite(id, tenantId);
  }

  // 3. Update staff member role, status (active/deactivated), or basic info
  @Patch('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update staff member role, status (active/deactivated), or details',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or cannot deactivate owner',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member or role not found',
  })
  async updateStaffMember(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.updateStaffMember(id, dto, tenantId, user);
  }

  // 4. Remove a staff member from the store
  @Delete('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a staff member from the store (Soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff member removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove store owner or self',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  async removeStaffMember(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.removeStaffMember(id, tenantId, user);
  }

  // 5. Get all store roles and their granular permission matrices
  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all store roles with assigned member counts and permission matrices',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles and permissions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  async getRoles(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.getRoles(tenantId);
  }

  // 6. Create a new custom staff role with permission matrix
  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new custom staff role with modular permission matrix',
  })
  @ApiResponse({
    status: 201,
    description: 'Custom role created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or role name exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.createRole(dto, tenantId);
  }

  // 7. Update role metadata or permission matrix
  @Patch('roles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update role details or granular permission matrix',
  })
  @ApiResponse({
    status: 200,
    description: 'Role permissions updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot rename system default role or name collision',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.updateRole(id, dto, tenantId);
  }

  // 8. Delete a custom staff role
  @Delete('roles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a custom staff role (System default roles cannot be deleted)',
  })
  @ApiResponse({
    status: 200,
    description: 'Custom role deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete system default role or role with assigned members',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Owner login token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async deleteRole(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.staffService.deleteRole(id, tenantId);
  }
}
