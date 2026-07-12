import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum MilkType {
  COW = 'COW',
  BUFFALO = 'BUFFALO',
  MIXED = 'MIXED'
}

export enum Shift {
  MORNING = 'MORNING',
  EVENING = 'EVENING'
}

export class CreateMilkCollectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Farmer ID is required' })
  farmerId: string;

  @IsEnum(MilkType, { message: 'Milk type must be COW, BUFFALO, or MIXED' })
  milkType: MilkType;

  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @IsNumber()
  @Min(1.0, { message: 'Fat % must be at least 1.0' })
  @Max(15.0, { message: 'Fat % must be at most 15.0' })
  fat: number;

  @IsNumber()
  @Min(5.0, { message: 'SNF % must be at least 5.0' })
  @Max(12.0, { message: 'SNF % must be at most 12.0' })
  snf: number;

  @IsNumber()
  @IsOptional()
  clr?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsNotEmpty({ message: 'Collection date is required' })
  collectedAt: string;

  @IsEnum(Shift, { message: 'Shift must be MORNING or EVENING' })
  shift: Shift;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsNumber()
  @IsOptional()
  manualAdjustment?: number;
}

export class UpdateMilkCollectionDto {
  @IsString()
  @IsOptional()
  farmerId?: string;

  @IsEnum(MilkType, { message: 'Milk type must be COW, BUFFALO, or MIXED' })
  @IsOptional()
  milkType?: MilkType;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(1.0)
  @Max(15.0)
  @IsOptional()
  fat?: number;

  @IsNumber()
  @Min(5.0)
  @Max(12.0)
  @IsOptional()
  snf?: number;

  @IsNumber()
  @IsOptional()
  clr?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  collectedAt?: string;

  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsNumber()
  @IsOptional()
  manualAdjustment?: number;
}
