import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { 
  ConfigureIntegrationDto, 
  TestIntegrationDto, 
  CreateWebhookSubscriptionDto, 
  UpdateWebhookSubscriptionDto, 
  TriggerPaymentDto, 
  UploadFileDto, 
  SendNotificationDto 
} from './dto/integrations.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';

@Controller('api/integrations')
@UseGuards(TenantGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('configs')
  @RequirePermissions('users:read')
  getConfigs() {
    return {
      success: true,
      data: this.integrationsService.getConfigs(),
    };
  }

  @Post('configure')
  @RequirePermissions('users:write')
  async configureIntegration(@Body() dto: ConfigureIntegrationDto) {
    const config = await this.integrationsService.configureIntegration(
      dto.provider,
      dto.credentials,
      dto.enabled,
    );
    return {
      success: true,
      message: 'Third-party provider API keys re-registered safely.',
      data: config,
    };
  }

  @Post('test')
  @RequirePermissions('users:write')
  async testIntegration(@Body() dto: TestIntegrationDto) {
    const result = await this.integrationsService.testIntegration(dto.provider);
    return {
      success: true,
      data: result,
    };
  }

  @Get('logs')
  @RequirePermissions('users:read')
  getLogs() {
    return {
      success: true,
      data: this.integrationsService.getLogs(),
    };
  }

  @Get('webhooks/subscriptions')
  @RequirePermissions('users:read')
  getSubscriptions() {
    return {
      success: true,
      data: this.integrationsService.getSubscriptions(),
    };
  }

  @Post('webhooks/subscriptions')
  @RequirePermissions('users:write')
  createSubscription(@Body() dto: CreateWebhookSubscriptionDto) {
    const sub = this.integrationsService.createSubscription(dto.url, dto.events);
    return {
      success: true,
      message: 'New Webhook outgoing subscription registered.',
      data: sub,
    };
  }

  @Put('webhooks/subscriptions/:id')
  @RequirePermissions('users:write')
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    const sub = this.integrationsService.updateSubscription(
      id,
      dto.url,
      dto.events,
      dto.enabled,
    );
    return {
      success: true,
      message: 'Webhook subscription policies updated.',
      data: sub,
    };
  }

  @Delete('webhooks/subscriptions/:id')
  @RequirePermissions('users:write')
  deleteSubscription(@Param('id') id: string) {
    this.integrationsService.deleteSubscription(id);
    return {
      success: true,
      message: 'Webhook subscription deleted.',
    };
  }

  @Get('webhooks/deliveries')
  @RequirePermissions('users:read')
  getDeliveryLogs() {
    return {
      success: true,
      data: this.integrationsService.getDeliveryLogs(),
    };
  }

  @Post('trigger-payment')
  @RequirePermissions('users:write')
  async triggerPayment(@Body() dto: TriggerPaymentDto) {
    const response = await this.integrationsService.processPayment(
      dto.provider,
      dto.amount,
      dto.currency,
      dto.customerId,
    );
    return {
      success: true,
      message: 'Settlement complete.',
      data: response,
    };
  }

  @Post('upload-file')
  @RequirePermissions('users:write')
  async uploadFile(@Body() dto: UploadFileDto) {
    const response = await this.integrationsService.uploadFile(
      dto.provider,
      dto.fileName,
      dto.content,
    );
    return {
      success: true,
      message: 'File successfully synchronised to storage archives.',
      data: response,
    };
  }

  @Post('send-notification')
  @RequirePermissions('users:write')
  async sendNotification(@Body() dto: SendNotificationDto) {
    const response = await this.integrationsService.sendNotification(
      dto.provider,
      dto.recipient,
      dto.subject,
      dto.message,
    );
    return {
      success: true,
      message: 'Notification successfully delivered.',
      data: response,
    };
  }

  @Post('oauth-google')
  @RequirePermissions('users:write')
  async exchangeGoogleToken(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Authorization code is required.');
    }
    const tokenPayload = await this.integrationsService.authenticateWithGoogle(code);
    return {
      success: true,
      message: 'Google sign-in certified.',
      data: tokenPayload,
    };
  }

  @Post('webhooks/incoming')
  @RequirePermissions('users:write')
  async handleIncomingWebhook(
    @Headers('X-DairySphere-Signature') signature: string,
    @Body() body: any,
  ) {
    // This receives test/production webhook events from external sources (such as Stripe)
    const rawPayload = JSON.stringify(body);
    const secret = 'whsec_secret_key_abc123'; // Matches standard Stripe test secret
    
    const isValid = this.integrationsService.verifyIncomingWebhookSignature(
      rawPayload,
      signature,
      secret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature verification failed.');
    }

    return {
      success: true,
      message: 'Incoming event verified and ingested successfully.',
      event: body.event || 'unknown',
    };
  }
}
