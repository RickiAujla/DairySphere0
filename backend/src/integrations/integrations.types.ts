export interface IntegrationConfig {
  id: string;
  provider: 'STRIPE' | 'RAZORPAY' | 'CASHFREE' | 'TWILIO' | 'WHATSAPP' | 'SMTP' | 'FIREBASE_PUSH' | 'S3' | 'GCS' | 'AZURE_BLOB' | 'TALLY' | 'GOOGLE_OAUTH';
  name: string;
  category: 'PAYMENTS' | 'COMMUNICATION' | 'STORAGE' | 'ACCOUNTING' | 'AUTH';
  enabled: boolean;
  credentials: Record<string, string>;
  lastTestedAt?: Date;
  status: 'ACTIVE' | 'ERROR' | 'UNCONFIGURED';
}

export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[]; // e.g. ["milk.collected", "invoice.paid", "payment.failed"]
  enabled: boolean;
  createdAt: Date;
}

export interface WebhookDeliveryLog {
  id: string;
  subscriptionId: string;
  event: string;
  payload: string;
  statusCode?: number;
  responseBody?: string;
  status: 'SUCCESS' | 'FAILED';
  retryCount: number;
  nextAttemptAt?: Date;
  createdAt: Date;
}

export interface IntegrationLog {
  id: string;
  provider: string;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  durationMs: number;
  timestamp: Date;
}
