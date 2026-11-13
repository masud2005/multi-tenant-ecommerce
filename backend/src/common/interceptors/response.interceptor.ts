import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: IPaginationMeta;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    const httpCode = this.reflector.get<number>(
      HTTP_CODE_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data: T) => {
        const body =
          data && typeof data === 'object'
            ? (data as {
                statusCode?: unknown;
                message?: unknown;
                data?: unknown;
                meta?: IPaginationMeta;
              })
            : {};
        const statusCode =
          typeof body.statusCode === 'number'
            ? body.statusCode
            : (httpCode ?? 200);
        const message =
          typeof body.message === 'string' ? body.message : 'Success';

        return {
          success: true,
          statusCode,
          message,
          data: (body.data !== undefined ? body.data : data) as T,
          ...(body.meta && { meta: body.meta }),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
