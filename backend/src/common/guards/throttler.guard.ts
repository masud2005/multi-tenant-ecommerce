import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { TooManyAttemptsException } from '../exceptions/business.exception';

type TrackerRequest = {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: { remoteAddress?: string };
};

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const ttl = throttlerLimitDetail.timeToExpire;
    const minutesLeft = ttl ? Math.ceil(ttl / 60) : undefined;
    return Promise.reject(new TooManyAttemptsException(minutesLeft));
  }

  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as TrackerRequest;
    const forwarded = request.headers?.['x-forwarded-for'];
    const realIp = request.headers?.['x-real-ip'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();
    const ip =
      forwardedIp ||
      (Array.isArray(realIp) ? realIp[0] : realIp) ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown';
    return Promise.resolve(ip);
  }
}
