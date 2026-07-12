import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const traceId = request['traceId'] || 'unknown';

    return next.handle().pipe(
      map((data) => {
        // If data is already an envelope, return it as-is
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return data;
        }

        return {
          success: true,
          timestamp: new Date().toISOString(),
          traceId,
          data,
        };
      }),
    );
  }
}
