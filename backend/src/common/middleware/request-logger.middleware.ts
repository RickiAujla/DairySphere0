import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CommonUtils } from '../utils/utils';
import { AppLogger } from '../logger/logger.service';
import { HTTP_HEADERS } from '../constants';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();
    const traceId = (req.headers[HTTP_HEADERS.TRACE_ID] as string) || CommonUtils.generateTraceId();
    
    // Attach trace ID to request context & response headers
    req['traceId'] = traceId;
    res.setHeader(HTTP_HEADERS.TRACE_ID, traceId);

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Log the request arrival
    this.logger.log(`Incoming Request: [${traceId}] ${method} ${originalUrl} - IP: ${ip} - UA: ${userAgent}`);

    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
      const { statusCode } = res;
      
      res.setHeader(HTTP_HEADERS.RESPONSE_TIME, `${durationMs}ms`);

      this.logger.log(
        `Completed Response: [${traceId}] ${method} ${originalUrl} - Status: ${statusCode} - Time: ${durationMs}ms`,
      );
    });

    next();
  }
}
