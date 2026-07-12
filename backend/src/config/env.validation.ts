import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsOptional, validateSync } from 'class-validator';
import { Environment } from '../common/constants';

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  HOST: string = '0.0.0.0';

  @IsString()
  @IsOptional()
  DATABASE_URL: string = 'postgresql://postgres:postgres@localhost:5432/dairysphere?schema=public';

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'dairysphere_fallback_secret_key_change_me_in_prod';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  REFRESH_EXPIRES_IN: string = '7d';
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Database Environment validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
}
