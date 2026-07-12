import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsObject({ message: 'Settings must be an object containing key-value pairs' })
  @IsNotEmpty()
  settings: Record<string, string>;
}

export class UpdatePreferencesDto {
  @IsString()
  @IsNotEmpty()
  theme: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
