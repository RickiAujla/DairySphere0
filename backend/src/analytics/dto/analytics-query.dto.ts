import { IsOptional, IsString, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TrendPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TrendPeriod)
  period?: TrendPeriod = TrendPeriod.MONTHLY;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsString()
  comparisonStartDate?: string;

  @IsOptional()
  @IsString()
  comparisonEndDate?: string;
}

export class ScheduleReportDto {
  @IsString()
  name!: string;

  @IsString()
  format!: 'PDF' | 'EXCEL' | 'CSV';

  @IsString()
  frequency!: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @IsString()
  recipients!: string; // Comma separated emails
}
