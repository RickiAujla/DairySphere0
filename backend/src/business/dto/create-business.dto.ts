import { IsString, IsEmail, IsNotEmpty, MinLength, Matches, IsOptional } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Business slug is required' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and dashes (e.g., my-dairy-farm)',
  })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin user name is required' })
  adminName: string;

  @IsEmail({}, { message: 'Invalid admin email address' })
  @IsNotEmpty({ message: 'Admin email is required' })
  adminEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  adminPassword: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
