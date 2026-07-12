import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateBusinessDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name cannot be empty' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  preferences?: string; // Stored as a serialized JSON configuration string in Settings
}
