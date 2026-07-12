import { Environment } from '../common/constants';

export interface AppConfig {
  env: string;
  port: number;
  host: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshExpiresIn: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV || Environment.DEVELOPMENT,
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dairysphere_fallback_secret_key_change_me_in_prod',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  },
});
