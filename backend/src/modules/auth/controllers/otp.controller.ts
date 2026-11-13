import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { OtpService } from '../services/otp.service';
import { SendOtpDto } from '../dto/send-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import {
  ThrottleOtp,
  ThrottleOtpResend,
} from '../../../common/decorators/throttle.decorator';

@ApiTags('(Auth) OTP')
@Controller('auth')
export class AuthOtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send-otp')
  @ThrottleOtp()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP by email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @Post('resend-otp')
  @ThrottleOtpResend()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP by challenge id or latest user purpose challenge',
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.otpService.resendOtp(dto);
  }

  @Post('verify-otp')
  @ThrottleOtp()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete register/login flow' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    const forwarded = req?.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : null) ||
      req?.ip ||
      null;
    return this.otpService.verifyOtp(dto, {
      userAgent: userAgent || req?.headers?.['user-agent'] || null,
      ipAddress: ip,
    });
  }
}
