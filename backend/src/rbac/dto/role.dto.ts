import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Permission name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Permission key is required' })
  key: string;

  @IsString()
  @IsNotEmpty({ message: 'Permission group is required' })
  group: string;

  @IsString()
  @IsOptional()
  description?: string;
}
