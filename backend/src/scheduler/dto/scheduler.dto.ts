import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class TriggerJobDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;
}

export class UpdateJobScheduleDto {
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxRetries?: number;
}
