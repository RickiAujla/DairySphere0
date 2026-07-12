import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import {
  AppLogger,
  AppValidationPipe,
  GlobalExceptionFilter,
  ResponseInterceptor,
  DEFAULT_PORT,
  DEFAULT_HOST,
} from './common/common.module';

async function bootstrap() {
  // Create application with transient-scoped custom logger
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(AppLogger);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // Retrieve configurations securely
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || DEFAULT_PORT;
  const host = configService.get<string>('host') || DEFAULT_HOST;
  const env = configService.get<string>('env') || 'development';

  // Security: Enable CORS safely
  app.enableCors({
    origin: '*', // Configurable in subsequent security phases
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Wire up enterprise validation & response transformation pipelines
  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Handle graceful shutdowns for production containers (SIGTERM/SIGINT)
  app.enableShutdownHooks();

  await app.listen(port, host);
  logger.log(`DairySphere backend core booted successfully in [${env}] mode`);
  logger.log(`Listening dynamically at http://${host}:${port}`);
}

bootstrap();
