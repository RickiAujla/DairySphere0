export interface ApiResponse<T = any> {
  success: boolean;
  timestamp: string;
  traceId?: string;
  data?: T;
  error?: ApiErrorPayload;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: any;
  path?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
