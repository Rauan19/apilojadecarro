import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const start = Date.now();
    const path = request.originalUrl || request.url;

    const shouldLog =
      Boolean(request.apiToken) ||
      path.startsWith('/api/public') ||
      path.startsWith('/public');

    if (!shouldLog) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          void this.persistLog(request, context, start);
        },
        error: () => {
          void this.persistLog(request, context, start);
        },
      }),
    );
  }

  private async persistLog(
    request: Request,
    context: ExecutionContext,
    start: number,
  ): Promise<void> {
    try {
      const response = context.switchToHttp().getResponse<Response>();
      await this.prisma.apiLog.create({
        data: {
          companyId:
            request.companyContext?.companyId ?? request.apiToken?.companyId,
          apiTokenId:
            request.apiToken?.id ?? request.companyContext?.apiTokenId,
          endpoint: request.originalUrl || request.url,
          method: request.method,
          ip: request.ip || request.socket?.remoteAddress,
          statusCode: response.statusCode,
          responseTime: Date.now() - start,
          userAgent: request.headers['user-agent'],
        },
      });
    } catch {
      // logging must never break the request lifecycle
    }
  }
}
