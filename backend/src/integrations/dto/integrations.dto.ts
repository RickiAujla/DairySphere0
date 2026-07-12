import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsObject, IsEnum, IsNumber, Min } from 'class-validator';

export class ConfigureIntegrationDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class TestIntegrationDto {
  @IsString()
  @IsNotEmpty()
  provider: string;
}

export class CreateWebhookSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateWebhookSubscriptionDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class TriggerPaymentDto {
  @IsString()
  @IsNotEmpty()
  provider: 'STRIPE' | 'RAZORPAY' | 'CASHFREE';

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;
}

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  provider: 'S3' | 'GCS' | 'AZURE_BLOB';

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  provider: 'TWILIO' | 'WHATSAPP' | 'SMTP' | 'FIREBASE_PUSH';

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
