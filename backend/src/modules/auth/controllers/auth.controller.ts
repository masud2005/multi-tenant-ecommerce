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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ThrottleRefreshToken,
  ThrottleRegister,
} from '../../../common/decorators/throttle.decorator';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../services/auth.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AcceptStaffInviteDto } from '../dto/accept-staff-invite.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator';

function headerText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function requestMeta(req: Request, userAgentHeader?: string) {
  const forwarded = headerText(req.headers['x-forwarded-for']);
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    null;
  return {
    userAgent: userAgentHeader || headerText(req.headers['user-agent']) || null,
    ipAddress: ip,
  };
}

@ApiTags('(Auth) Account')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ThrottleRegister()
  @ApiOperation({ summary: 'Register user basic information' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  // @ThrottleLogin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify login credentials and create a device session',
  })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, requestMeta(req, userAgent));
  }

  @Post('refresh-token')
  @ThrottleRefreshToken()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current device session' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id, user.sid);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active login sessions for the current user' })
  async listSessions(@CurrentUser() user: AuthUser) {
    return this.authService.listSessions(user.id, user.sid);
  }

  @Delete('sessions/others')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out of all devices except the current one' })
  async revokeOtherSessions(@CurrentUser() user: AuthUser) {
    return this.authService.revokeOtherSessions(user.id, user.sid);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out a specific device session' })
  async revokeSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.authService.revokeSession(user.id, id, user.sid);
  }

  // Validate staff invite link token
  @Get('staff/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate staff invitation token' })
  @ApiResponse({ status: 200, description: 'Token validated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async validateStaffInvite(@Query('token') token: string) {
    return this.authService.validateStaffInvite(token);
  }

  // Accept staff invite, set password, and auto-login
  @Post('staff/accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept staff invitation and set initial password' })
  @ApiResponse({
    status: 200,
    description: 'Staff account activated successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async acceptStaffInvite(
    @Body() dto: AcceptStaffInviteDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.acceptStaffInvite(dto, requestMeta(req, userAgent));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and session info' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
