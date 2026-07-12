import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { TriggerJobDto, UpdateJobScheduleDto } from './dto/scheduler.dto';
import { TenantGuard } from '../business/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';

@Controller('api/scheduler')
@UseGuards(TenantGuard, PermissionsGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('jobs')
  @RequirePermissions('users:read')
  getJobs() {
    return {
      success: true,
      data: this.schedulerService.getJobs(),
    };
  }

  @Get('queue')
  @RequirePermissions('users:read')
  getQueue() {
    return {
      success: true,
      data: this.schedulerService.getQueue(),
    };
  }

  @Get('history')
  @RequirePermissions('users:read')
  getHistory() {
    return {
      success: true,
      data: this.schedulerService.getHistory(),
    };
  }

  @Post('trigger')
  @RequirePermissions('users:write')
  async triggerJob(@Body() dto: TriggerJobDto) {
    const queueEntry = await this.schedulerService.triggerJob(dto.jobId);
    return {
      success: true,
      message: 'Job successfully enqueued for background worker thread execution.',
      data: queueEntry,
    };
  }

  @Put('jobs/:id')
  @RequirePermissions('users:write')
  updateJobSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateJobScheduleDto,
  ) {
    const updatedJob = this.schedulerService.updateJobSchedule(
      id,
      dto.cronExpression,
      dto.maxRetries,
    );
    return {
      success: true,
      message: 'Job scheduled cron policy updated successfully.',
      data: updatedJob,
    };
  }

  @Delete('history')
  @RequirePermissions('users:write')
  clearHistory() {
    this.schedulerService.clearHistory();
    return {
      success: true,
      message: 'Scheduler job execution history records cleared safely.',
    };
  }
}
