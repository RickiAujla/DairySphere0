import { 
  IsNotEmpty, 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  ValidateNested, 
  IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MobileDeviceType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  TABLET = 'TABLET'
}

export enum MobileMilkType {
  COW = 'COW',
  BUFFALO = 'BUFFALO',
  MIXED = 'MIXED'
}

export enum MobileShift {
  MORNING = 'MORNING',
  EVENING = 'EVENING'
}

export enum MobileSyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

// ==========================================
// AUTHENTICATION & DEVICE DTOS
// ==========================================

export class MobileLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsEnum(MobileDeviceType)
  @IsOptional()
  deviceType?: MobileDeviceType;

  @IsString()
  @IsOptional()
  pushToken?: string;
}

export class MobileRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class DeviceRegisterDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  deviceName!: string;

  @IsEnum(MobileDeviceType)
  @IsNotEmpty()
  deviceType!: MobileDeviceType;

  @IsString()
  @IsOptional()
  pushToken?: string;
}

// ==========================================
// OFFLINE SYNC DTOS
// ==========================================

export class SyncItemDto {
  @IsString()
  @IsNotEmpty()
  entityName!: string; // e.g. 'MilkCollection', 'Customer'

  @IsEnum(MobileSyncAction)
  @IsNotEmpty()
  action!: MobileSyncAction;

  @IsString()
  @IsNotEmpty()
  clientId!: string; // Client-side temp UUID

  @IsString()
  @IsOptional()
  serverId?: string; // Null for creates, set for updates/deletes

  @IsNotEmpty()
  data!: any; // Actual record fields

  @IsDateString()
  @IsNotEmpty()
  clientUpdatedAt!: string;
}

export class SyncRequestDto {
  @IsDateString()
  @IsOptional()
  lastSyncedAt?: string; // ISO String to retrieve deltas

  @IsArray()
  @IsOptional()
  @ValidateNested({ friendships: true, each: true })
  @Type(() => SyncItemDto)
  clientChanges?: SyncItemDto[];
}

// ==========================================
// FARMER DTOS
// ==========================================

export class CreateFarmerMobileDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  contacts?: string[];

  @IsString()
  @IsOptional()
  aadhaar?: string;

  @IsString()
  @IsOptional()
  pan?: string;

  @IsString()
  @IsOptional()
  gst?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  ifscCode?: string;

  @IsString()
  @IsOptional()
  upiId?: string;

  @IsEnum(MobileMilkType)
  @IsOptional()
  milkPreference?: MobileMilkType;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

// ==========================================
// MILK COLLECTION LOGS DTOS
// ==========================================

export class CreateMilkCollectionMobileDto {
  @IsString()
  @IsNotEmpty()
  farmerName!: string;

  @IsString()
  @IsOptional()
  farmerPhone?: string;

  @IsEnum(MobileMilkType)
  @IsNotEmpty()
  milkType!: MobileMilkType;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  fat!: number;

  @IsNumber()
  @IsNotEmpty()
  snf!: number;

  @IsEnum(MobileShift)
  @IsNotEmpty()
  shift!: MobileShift;

  @IsDateString()
  @IsNotEmpty()
  collectedAt!: string;
}

// ==========================================
// SALES AND ORDERS DTOS
// ==========================================

export class CreateSaleMobileDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsEnum(MobileMilkType)
  @IsNotEmpty()
  milkType!: MobileMilkType;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  ratePerLiter!: number;

  @IsEnum(MobileShift)
  @IsNotEmpty()
  shift!: MobileShift;

  @IsDateString()
  @IsNotEmpty()
  soldAt!: string;
}

// ==========================================
// EXPENSE DTOS
// ==========================================

export class CreateExpenseMobileDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsDateString()
  @IsNotEmpty()
  spentAt!: string;
}
