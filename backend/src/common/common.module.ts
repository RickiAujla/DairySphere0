import { Module, Global } from '@nestjs/common';
import { AppLogger } from './logger/logger.service';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class CommonModule {}
export { AppLogger };
export { CommonUtils } from './utils/utils';
export { SYSTEM_METADATA, Environment, HTTP_HEADERS } from './constants';
export type { ApiResponse, ApiErrorPayload, PaginationMeta, PaginatedResponse } from './types';
export { AppValidationPipe } from './pipes/validation.pipe';
export { GlobalExceptionFilter } from './filters/global-exception.filter';
export { ResponseInterceptor } from './interceptors/response.interceptor';
export { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
export { DEFAULT_PORT, DEFAULT_HOST } from './constants';
