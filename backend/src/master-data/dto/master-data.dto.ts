import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, IsEnum } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProductCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty({ message: 'Route name is required' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startPoint?: string;

  @IsString()
  @IsOptional()
  endPoint?: string;
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startPoint?: string;

  @IsString()
  @IsOptional()
  endPoint?: string;
}

export class UpdateMasterSettingsDto {
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, any>;
}
