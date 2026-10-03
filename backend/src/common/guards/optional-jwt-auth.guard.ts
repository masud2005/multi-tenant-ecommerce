import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allow request to proceed even if token is not provided
  handleRequest<TUser = any>(err: any, user: any): TUser {
    return user || undefined;
  }
}
