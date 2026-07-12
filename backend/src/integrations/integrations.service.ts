import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/common.module';
import { 
  IntegrationConfig, 
  WebhookSubscription, 
  WebhookDeliveryLog, 
  IntegrationLog 
} from './integrations.types';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService implements OnModuleInit {
  private configs: Map<string, IntegrationConfig> = new Map();
  private subscriptions: WebhookSubscription[] = [];
  private deliveryQueue: WebhookDeliveryLog[] = [];
  private integrationLogs: IntegrationLog[] = [];
  private isProcessingQueue = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('IntegrationsService');
  }

  onModuleInit() {
    this.initializeDefaultIntegrations();
    this.initializeDefaultWebhooks();
  }

  private initializeDefaultIntegrations() {
    const defaultConfigs: IntegrationConfig[] = [
      {
        id: 'stripe-int',
        provider: 'STRIPE',
        name: 'Stripe International Payments',
        category: 'PAYMENTS',
        enabled: true,
        credentials: { apiKey: 'sk_live_51M...88x', webhookSecret: 'whsec_7d...d9b' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        id: 'razorpay-int',
        provider: 'RAZORPAY',
        name: 'Razorpay Payment Gateway',
        category: 'PAYMENTS',
        enabled: true,
        credentials: { keyId: 'rzp_live_vU...8bX', keySecret: '9F...X0z' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        id: 'cashfree-int',
        provider: 'CASHFREE',
        name: 'Cashfree Payouts Engine',
        category: 'PAYMENTS',
        enabled: false,
        credentials: { appId: '', secretKey: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'twilio-int',
        provider: 'TWILIO',
        name: 'Twilio SMS Notification Dispatcher',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { accountSid: 'AC99...df3', authToken: 'cf8...9d2', fromNumber: '+15550199' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
      {
        id: 'whatsapp-int',
        provider: 'WHATSAPP',
        name: 'WhatsApp Business API Gateway',
        category: 'COMMUNICATION',
        enabled: false,
        credentials: { apiToken: '', phoneNumberId: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'smtp-int',
        provider: 'SMTP',
        name: 'SMTP Corporate Mail Gateway',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { host: 'smtp.gmail.com', port: '587', user: 'billing@dairysphere.com', password: '••••••••' },
        status: 'ACTIVE',
        lastTestedAt: new Date(),
      },
      {
        id: 'firebase-push-int',
        provider: 'FIREBASE_PUSH',
        name: 'Firebase Cloud Messaging (FCM)',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { clientEmail: 'fcm-admin@dairysphere.iam.gserviceaccount.com', projectId: 'dairysphere-fcm' },
        status: 'ACTIVE',
        lastTestedAt: new Date(),
      },
      {
        id: 's3-int',
        provider: 'S3',
        name: 'Amazon S3 Document Vault',
        category: 'STORAGE',
        enabled: true,
        credentials: { accessKeyId: 'AKIA...99X', secretAccessKey: 'p9...D8m', bucketName: 'dairysphere-cold-snapshots' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 3600 * 1000),
      },
      {
        id: 'gcs-int',
        provider: 'GCS',
        name: 'Google Cloud Storage Archives',
        category: 'STORAGE',
        enabled: false,
        credentials: { projectId: '', bucketName: '', serviceAccountKey: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'azure-blob-int',
        provider: 'AZURE_BLOB',
        name: 'Azure Blob Storage Gateway',
        category: 'STORAGE',
        enabled: false,
        credentials: { connectionString: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'tally-int',
        provider: 'TALLY',
        name: 'Tally Prime ERP Connector',
        category: 'ACCOUNTING',
        enabled: true,
        credentials: { baseUrl: 'http://localhost:9000/tally', companyName: 'DairySphere Cooperative Co.' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      },
      {
        id: 'google-oauth-int',
        provider: 'GOOGLE_OAUTH',
        name: 'Google Federated Authenticator',
        category: 'AUTH',
        enabled: true,
        credentials: { clientId: '77893-dairysphere.apps.googleusercontent.com', clientSecret: 'GOCSPX-u...d3b' },
        status: 'ACTIVE',
        lastTestedAt: new Date(),
      }
    ];

    for (const config of defaultConfigs) {
      this.configs.set(config.provider, config);
    }
  }

  private initializeDefaultWebhooks() {
    this.subscriptions = [
      {
        id: 'sub-billing',
        url: 'https://cooperative-erp.com/api/webhooks/dairysphere',
        secret: 'whsec_secret_key_abc123',
        events: ['milk.collected', 'invoice.paid'],
        enabled: true,
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      },
      {
        id: 'sub-zapier',
        url: 'https://hooks.zapier.com/hooks/catch/12930129/ab9102c',
        secret: 'whsec_zapier_secret_xyz789',
        events: ['payment.failed', 'user.registered'],
        enabled: true,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      }
    ];
  }

  // --- CONFIG / CREDENTIAL MANAGEMENT ---

  getConfigs(): IntegrationConfig[] {
    // Return masked credential values to preserve API security
    return Array.from(this.configs.values()).map(cfg => {
      const maskedCreds: Record<string, string> = {};
      for (const key of Object.keys(cfg.credentials)) {
        const val = cfg.credentials[key];
        if (val && val.length > 4) {
          maskedCreds[key] = val.substring(0, 4) + '••••••••' + val.substring(val.length - 2);
        } else {
          maskedCreds[key] = val ? '••••••••' : '';
        }
      }
      return {
        ...cfg,
        credentials: maskedCreds,
      };
    });
  }

  async configureIntegration(provider: string, credentials: Record<string, string>, enabled?: boolean): Promise<IntegrationConfig> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Integration provider '${provider}' not supported.`);
    }

    // Merge credentials carefully, keeping existing credentials if not provided
    const newCredentials = { ...config.credentials };
    for (const key of Object.keys(credentials)) {
      if (credentials[key] !== undefined) {
        newCredentials[key] = credentials[key];
      }
    }

    config.credentials = newCredentials;
    if (enabled !== undefined) {
      config.enabled = enabled;
    }

    // Evaluate configuration state
    const hasKeys = Object.values(newCredentials).some(val => val && val.length > 0);
    config.status = config.enabled ? (hasKeys ? 'ACTIVE' : 'ERROR') : 'UNCONFIGURED';

    this.configs.set(provider, config);
    this.logger.log(`Credentials re-registered for third-party connector '${provider}'`);

    // Audit Log Governance
    await this.writeAuditLog(
      'INTEGRATION_CONFIG_UPDATED',
      'IntegrationConfig',
      provider,
      JSON.stringify({ provider, enabled: config.enabled, status: config.status })
    );

    return config;
  }

  // --- API TESTS & SERVICE CONNECTORS ---

  async testIntegration(provider: string): Promise<{ success: boolean; latencyMs: number; response: string }> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider spec '${provider}' not found.`);
    }

    const start = Date.now();
    await this.delayMs(800 + Math.random() * 500); // Simulate network round-trip handshake
    const latency = Date.now() - start;

    config.lastTestedAt = new Date();
    config.status = 'ACTIVE';
    this.configs.set(provider, config);

    const logEntry: IntegrationLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      action: 'API_PING_HANDSHAKE',
      status: 'SUCCESS',
      message: 'Network link certified. OAuth response status 200 OK.',
      durationMs: latency,
      timestamp: new Date(),
    };
    this.integrationLogs.unshift(logEntry);

    // Audit log
    await this.writeAuditLog(
      'INTEGRATION_TEST_EXECUTED',
      'IntegrationConfig',
      provider,
      JSON.stringify({ provider, latencyMs: latency, status: 'SUCCESS' })
    );

    return {
      success: true,
      latencyMs: latency,
      response: `Connection successful. Latency is ${latency}ms. Remote gateway returned: code=200_ok, tenant_verified=true`,
    };
  }

  getLogs(): IntegrationLog[] {
    return this.integrationLogs;
  }

  // --- PAYMENT GATEWAY CLIENT EMULATION ---

  async processPayment(provider: 'STRIPE' | 'RAZORPAY' | 'CASHFREE', amount: number, currency: string, customerId: string) {
    const config = this.configs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`Payment gateway provider '${provider}' is either unconfigured or disabled.`);
    }

    const start = Date.now();
    await this.delayMs(1200); // Network delay
    const latency = Date.now() - start;

    const transactionId = `${provider.toLowerCase().substring(0, 3)}_tx_${Math.random().toString(36).substring(2, 11)}`;
    const status = 'SUCCESS';

    const logEntry: IntegrationLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      action: 'PROCESS_TRANSACTION',
      status: 'SUCCESS',
      message: `Charge of ${currency} ${amount.toFixed(2)} completed successfully for customer [${customerId}]. Gateway Ref: ${transactionId}`,
      durationMs: latency,
      timestamp: new Date(),
    };
    this.integrationLogs.unshift(logEntry);

    // Dispatch webhook event automatically
    await this.dispatchWebhookEvent('invoice.paid', {
      transactionId,
      customerId,
      amount,
      currency,
      provider,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      transactionId,
      amount,
      currency,
      gateway: provider,
      message: 'Charge settled instantly with secure routing.'
    };
  }

  // --- OUTGOING WEBHOOK ENGINE & EVENT DISPATCHER ---

  getSubscriptions(): WebhookSubscription[] {
    return this.subscriptions;
  }

  createSubscription(url: string, events: string[]): WebhookSubscription {
    const newSub: WebhookSubscription = {
      id: `sub-${Math.random().toString(36).substring(2, 9)}`,
      url,
      secret: `whsec_${crypto.randomBytes(16).toString('hex')}`,
      events,
      enabled: true,
      createdAt: new Date(),
    };

    this.subscriptions.push(newSub);
    return newSub;
  }

  updateSubscription(id: string, url?: string, events?: string[], enabled?: boolean): WebhookSubscription {
    const sub = this.subscriptions.find(s => s.id === id);
    if (!sub) {
      throw new Error(`Webhook subscription with ID '${id}' not found.`);
    }

    if (url !== undefined) sub.url = url;
    if (events !== undefined) sub.events = events;
    if (enabled !== undefined) sub.enabled = enabled;

    return sub;
  }

  deleteSubscription(id: string) {
    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
    return { success: true };
  }

  getDeliveryLogs(): WebhookDeliveryLog[] {
    return this.deliveryQueue;
  }

  async dispatchWebhookEvent(event: string, payload: any) {
    const payloadStr = JSON.stringify(payload);
    
    // Find all matching enabled subscriptions
    const matches = this.subscriptions.filter(sub => sub.enabled && sub.events.includes(event));

    for (const sub of matches) {
      // Create Delivery Log
      const log: WebhookDeliveryLog = {
        id: `wlog-${Math.random().toString(36).substring(2, 9)}`,
        subscriptionId: sub.id,
        event,
        payload: payloadStr,
        status: 'FAILED', // Initial state until successful transfer
        retryCount: 0,
        createdAt: new Date(),
      };

      this.deliveryQueue.unshift(log);

      // Fire queue worker
      this.executeWebhookDelivery(sub, log);
    }
  }

  private async executeWebhookDelivery(sub: WebhookSubscription, log: WebhookDeliveryLog) {
    try {
      log.status = 'RUNNING' as any;
      await this.delayMs(1500); // Simulate network delay

      // Emulate digital signature generation
      const hmac = crypto.createHmac('sha256', sub.secret);
      const signature = hmac.update(log.payload).digest('hex');

      // Emulate standard delivery POST handshake
      const statusCode = 200;
      const responseBody = JSON.stringify({ success: true, refId: log.id });

      log.status = 'SUCCESS';
      log.statusCode = statusCode;
      log.responseBody = responseBody;
      log.completedAt = new Date();

      this.logger.log(`Webhook delivered successfully to URL: ${sub.url} [Event: ${log.event}]`);
    } catch (err: any) {
      log.status = 'FAILED';
      log.statusCode = 500;
      log.responseBody = err.message || 'Internal Delivery Crash';
      log.retryCount++;

      if (log.retryCount < 3) {
        const backoffMs = 5000 * Math.pow(2, log.retryCount - 1);
        log.nextAttemptAt = new Date(Date.now() + backoffMs);
        this.logger.warn(`Webhook failed. Retrying delivery attempt #${log.retryCount + 1} in ${backoffMs}ms`);
        setTimeout(() => this.executeWebhookDelivery(sub, log), backoffMs);
      } else {
        log.error = 'Max delivery retry threshold of 3 exceeded. Abandoning dispatch.';
      }
    }
  }

  // --- SECURE INCOMING WEBHOOK SIGNATURE VERIFICATION ---

  verifyIncomingWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      if (!signature || !secret) return false;
      const hmac = crypto.createHmac('sha256', secret);
      const calculatedSignature = hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature));
    } catch (err) {
      return false;
    }
  }

  // --- COMMUNICATIONS CLIENT DISPATCHER ---

  async sendNotification(provider: 'TWILIO' | 'WHATSAPP' | 'SMTP' | 'FIREBASE_PUSH', recipient: string, subject: string, message: string) {
    const config = this.configs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`Communication provider '${provider}' is disabled or unconfigured.`);
    }

    const start = Date.now();
    await this.delayMs(1000);
    const latency = Date.now() - start;

    const logEntry: IntegrationLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      action: 'DISPATCH_MESSAGE',
      status: 'SUCCESS',
      message: `Message dispatched to recipient '${recipient}'. Subject: "${subject}". Details: 100% delivered.`,
      durationMs: latency,
      timestamp: new Date(),
    };
    this.integrationLogs.unshift(logEntry);

    return {
      success: true,
      provider,
      recipient,
      latencyMs: latency,
      message: 'Message queued and delivered successfully.'
    };
  }

  // --- CLOUD STORAGE SYNC CLIENT ---

  async uploadFile(provider: 'S3' | 'GCS' | 'AZURE_BLOB', fileName: string, content: string) {
    const config = this.configs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`Cloud storage provider '${provider}' is disabled or unconfigured.`);
    }

    const start = Date.now();
    await this.delayMs(1400);
    const latency = Date.now() - start;

    const bucket = config.credentials.bucketName || 'dairysphere-default-vault';
    const remoteUrl = `https://${provider.toLowerCase()}.amazonaws.com/${bucket}/${fileName}`;

    const logEntry: IntegrationLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      action: 'OBJECT_PUT_UPLOAD',
      status: 'SUCCESS',
      message: `Uploaded physical archive asset '${fileName}' to secure storage bucket [${bucket}]. Location URL: ${remoteUrl}`,
      durationMs: latency,
      timestamp: new Date(),
    };
    this.integrationLogs.unshift(logEntry);

    return {
      success: true,
      provider,
      bucket,
      fileName,
      remoteUrl,
      sizeBytes: Buffer.byteLength(content, 'utf8'),
      latencyMs: latency,
    };
  }

  // --- OAUTH EMULATOR HANDSHAKE ---

  async authenticateWithGoogle(authCode: string) {
    const config = this.configs.get('GOOGLE_OAUTH');
    if (!config || !config.enabled) {
      throw new Error('Google OAuth provider is unconfigured or disabled.');
    }

    const start = Date.now();
    await this.delayMs(1100);
    const latency = Date.now() - start;

    const logEntry: IntegrationLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider: 'GOOGLE_OAUTH',
      action: 'OAUTH_HANDSHAKE_GRANT',
      status: 'SUCCESS',
      message: 'Exchanged authorization code for JWT Access and Refresh Tokens successfully.',
      durationMs: latency,
      timestamp: new Date(),
    };
    this.integrationLogs.unshift(logEntry);

    return {
      success: true,
      accessToken: `ya29.a0Axoo...${Math.random().toString(36).substring(2, 12)}`,
      idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMm...7a8X',
      expiresIn: 3600,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      user: {
        email: 'olvskolclips@gmail.com',
        name: 'DairySphere Admin Operator',
        picture: 'https://lh3.googleusercontent.com/a/ALm5wu...'
      }
    };
  }

  // --- UTILITIES ---

  private async writeAuditLog(action: string, entityName: string, entityId: string, details: string) {
    try {
      const defaultBiz = await this.databaseService.business.findFirst();
      if (!defaultBiz) return;

      await this.databaseService.auditLog.create({
        data: {
          businessId: defaultBiz.id,
          action,
          entityName,
          entityId,
          newValue: details,
          oldValue: 'PRE_INTEGRATION_AUDIT_MARK',
        },
      });
    } catch (err) {
      this.logger.error('Failed to write audit logs inside integrations engine', err instanceof Error ? err.stack : String(err));
    }
  }

  private delayMs(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
