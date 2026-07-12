import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { SYSTEM_METADATA } from '../constants';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context = 'System';

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.printMessage('INFO', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printMessage('ERROR', message, context || this.context);
    if (trace) {
      process.stderr.write(`[TRACE] ${trace}\n`);
    }
  }

  warn(message: any, context?: string) {
    this.printMessage('WARN', message, context);
  }

  debug?(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.printMessage('DEBUG', message, context);
    }
  }

  verbose?(message: any, context?: string) {
    this.printMessage('VERBOSE', message, context);
  }

  private printMessage(level: string, message: any, context?: string) {
    const activeContext = context || this.context;
    const timestamp = new Date().toISOString();
    const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    
    // Clean, highly readable, structured logging for enterprise observability
    const output = `[${timestamp}] [${SYSTEM_METADATA.appName}] [${level}] [${activeContext}] ${formattedMessage}\n`;
    
    if (level === 'ERROR') {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  }
}
