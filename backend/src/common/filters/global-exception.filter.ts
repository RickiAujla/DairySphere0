import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLogger } from '../logger/logger.service';
import { ApiResponse } from '../types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = request['traceId'] || 'unknown';
    
    let message = 'Internal Server Error';
    let details: any = null;
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      const resPayload = exception.getResponse();
      message = exception.message || String(resPayload);
      if (typeof resPayload === 'object' && resPayload !== null) {
        message = (resPayload as any).message || message;
        details = (resPayload as any).error || null;
        code = (resPayload as any).code || 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
      code = 'UNHANDLED_EXCEPTION';
    }

    // High fidelity error logging
    this.logger.error(
      `Exception caught on ${request.method} ${request.url}: ${message}`,
      exception.stack || String(exception),
    );

    const errorResponse: ApiResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      traceId,
      error: {
        code,
        message,
        details: process.env.NODE_ENV !== 'production' ? details : undefined,
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
