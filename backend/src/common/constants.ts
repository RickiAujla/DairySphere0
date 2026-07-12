export const SYSTEM_METADATA = {
  appName: 'DairySphere',
  version: '1.2.0',
  stage: 'Stage 1.3 - Backend Core',
};

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export const HTTP_HEADERS = {
  TRACE_ID: 'x-dairysphere-trace-id',
  RESPONSE_TIME: 'x-response-time',
};

export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = '0.0.0.0';
