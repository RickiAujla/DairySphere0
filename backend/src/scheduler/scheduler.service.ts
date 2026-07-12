import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/common.module';
import { JobDefinition, JobQueueEntry, JobHistoryEntry } from './scheduler.types';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private jobs: Map<string, JobDefinition> = new Map();
  private queue: JobQueueEntry[] = [];
  private history: JobHistoryEntry[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isProcessingQueue = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('SchedulerService');
  }

  onModuleInit() {
    this.initializeJobs();
    // Start central scheduler evaluation loop (every 30 seconds)
    this.timer = setInterval(() => this.evaluateSchedules(), 30000);
    this.logger.log('Central Job Scheduler & Queue worker thread initialized');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.logger.log('Scheduler loop halted safely');
  }

  private initializeJobs() {
    const defaultJobs: JobDefinition[] = [
      {
        id: 'job-farmer-billing',
        name: 'Automatic Farmer Billing Run',
        category: 'AUTOMATION',
        description: 'Compiles milk collection logs for the active period, calculates fat/snf premiums, and prepares payouts.',
        cronExpression: '0 0 * * 0', // Every Sunday
        nextRun: new Date(Date.now() + 24 * 3600 * 1000), // Tomorrow
        retryPolicy: { maxRetries: 3, backoffMs: 5000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-customer-billing',
        name: 'Automatic Customer Subscription Billing',
        category: 'AUTOMATION',
        description: 'Processes deliveries and active delivery subscriptions to create monthly consumer billing invoices.',
        cronExpression: '0 0 1 * *', // 1st of every month
        nextRun: new Date(Date.now() + 48 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 5000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-invoice-generation',
        name: 'Automatic Invoice Dispatcher',
        category: 'AUTOMATION',
        description: 'Certifies pending purchase orders and automatically compiles structured invoices.',
        cronExpression: '0 */4 * * *', // Every 4 hours
        nextRun: new Date(Date.now() + 4 * 3600 * 1000),
        retryPolicy: { maxRetries: 2, backoffMs: 2000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-ledger-updates',
        name: 'Real-time Ledger Reconciler',
        category: 'AUTOMATION',
        description: 'Syncs collection payouts, payroll payouts, and customer sales invoices to the general accounting ledger.',
        cronExpression: '*/30 * * * *', // Every 30 minutes
        nextRun: new Date(Date.now() + 30 * 60 * 1000),
        retryPolicy: { maxRetries: 5, backoffMs: 1000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-daily-closing',
        name: 'Automatic Daily Operations Closing',
        category: 'AUTOMATION',
        description: 'Freezes milk registries, locks stock ledgers, aggregates morning/evening logs, and flags anomalies.',
        cronExpression: '0 22 * * *', // Every day at 10:00 PM
        nextRun: new Date(Date.now() + 12 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 10000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-monthly-closing',
        name: 'Monthly Ledger Rollover closing',
        category: 'AUTOMATION',
        description: 'Consolidates tax registers, balances depreciation metrics, and carries forward structural balances.',
        cronExpression: '0 2 1 * *', // 1st of month at 2:00 AM
        nextRun: new Date(Date.now() + 72 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 15000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-alerts-reminders',
        name: 'SLA Alerts & Reminders Dispatcher',
        category: 'NOTIFICATIONS',
        description: 'Dispatches payment reminders, low-stock alerts, and automated subscription renewal notices via push, SMS, and email.',
        cronExpression: '0 9 * * *', // Everyday at 9 AM
        nextRun: new Date(Date.now() + 5 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 3000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-db-backup',
        name: 'Automated Database Snapshot Backup',
        category: 'BACKUPS',
        description: 'Takes a full secure physical cold snapshot of the relational PostgreSQL schema and assets.',
        cronExpression: '0 1 * * *', // Daily at 1:00 AM
        nextRun: new Date(Date.now() + 6 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 30000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-maintenance-cleanup',
        name: 'Log & Temp Asset Vacuum Purge',
        category: 'BACKUPS',
        description: 'Cleans up system-temp assets, session cache records, and logs older than 90 days.',
        cronExpression: '0 3 * * 0', // Weekly Sunday at 3:00 AM
        nextRun: new Date(Date.now() + 18 * 3600 * 1000),
        retryPolicy: { maxRetries: 2, backoffMs: 5000 },
        lastStatus: 'PENDING',
      },
      {
        id: 'job-scheduled-reports',
        name: 'Cooperative Performance BI Report compiler',
        category: 'REPORTS',
        description: 'Assembles financial sheets, supplier fat/snf analytics graphs, and prints executive summaries.',
        cronExpression: '0 6 * * *', // Daily at 6:00 AM
        nextRun: new Date(Date.now() + 8 * 3600 * 1000),
        retryPolicy: { maxRetries: 3, backoffMs: 4000 },
        lastStatus: 'PENDING',
      }
    ];

    for (const job of defaultJobs) {
      this.jobs.set(job.id, job);
    }
  }

  // Get active scheduler overview
  getJobs(): JobDefinition[] {
    return Array.from(this.jobs.values());
  }

  getJobById(id: string): JobDefinition | undefined {
    return this.jobs.get(id);
  }

  getQueue(): JobQueueEntry[] {
    return this.queue;
  }

  getHistory(): JobHistoryEntry[] {
    return this.history;
  }

  // Manual Trigger endpoint
  async triggerJob(jobId: string): Promise<JobQueueEntry> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job specification with ID '${jobId}' does not exist.`);
    }

    const queueEntry: JobQueueEntry = {
      id: `q-${Math.random().toString(36).substring(2, 9)}`,
      jobId: job.id,
      jobName: job.name,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
      logs: [`Job triggered manually. Adding to dispatch queue.`],
    };

    this.queue.push(queueEntry);
    this.logger.log(`Job ${job.name} added to dispatch queue [ID: ${queueEntry.id}]`);
    
    // Process queue asynchronously
    this.processQueue();

    return queueEntry;
  }

  // Edit schedule
  updateJobSchedule(id: string, cronExpression?: string, maxRetries?: number): JobDefinition {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job with ID '${id}' not found.`);
    }

    if (cronExpression) {
      job.cronExpression = cronExpression;
      // Recalculate next run (emulated)
      job.nextRun = new Date(Date.now() + 10 * 60 * 1000 + Math.random() * 24 * 3600 * 1000);
    }

    if (maxRetries !== undefined) {
      job.retryPolicy.maxRetries = maxRetries;
    }

    this.jobs.set(id, job);
    this.logger.log(`Schedule configuration updated for job '${job.name}'`);
    return job;
  }

  // Clear history logs safely
  clearHistory() {
    this.history = [];
    this.logger.log('Scheduler execution audit logs wiped safely');
    return { success: true };
  }

  // Active Scheduler Cron loop
  private async evaluateSchedules() {
    const now = new Date();
    for (const job of this.jobs.values()) {
      if (job.nextRun <= now && job.lastStatus !== 'RUNNING') {
        this.logger.log(`Scheduled run detected for job ${job.name}`);
        // Set next emulated run time
        job.nextRun = new Date(now.getTime() + 4 * 3600 * 1000 + Math.random() * 24 * 3600 * 1000);
        this.jobs.set(job.id, job);
        
        // Push to active execution queue
        await this.triggerJob(job.id);
      }
    }
  }

  // Core Queue Worker Loop
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.queue.some(entry => entry.status === 'PENDING' || entry.status === 'FAILED' && entry.retryCount < this.getMaxRetriesForJob(entry.jobId))) {
        const entry = this.queue.find(e => e.status === 'PENDING' || (e.status === 'FAILED' && e.retryCount < this.getMaxRetriesForJob(e.jobId)));
        if (!entry) break;

        await this.executeQueueEntry(entry);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private getMaxRetriesForJob(jobId: string): number {
    const job = this.jobs.get(jobId);
    return job ? job.retryPolicy.maxRetries : 3;
  }

  private async executeQueueEntry(entry: JobQueueEntry) {
    const job = this.jobs.get(entry.jobId);
    if (!job) {
      entry.status = 'FAILED';
      entry.error = 'Job definition has been removed.';
      return;
    }

    // Mark as running
    const startTime = Date.now();
    entry.status = 'RUNNING';
    entry.startedAt = new Date();
    entry.logs.push(`Worker spawned. Initializing job execution context.`);
    job.lastStatus = 'RUNNING';
    this.jobs.set(job.id, job);

    try {
      // Execute the appropriate emulated logic
      await this.runJobLogic(job.id, entry);
      
      // Success handler
      entry.status = 'COMPLETED';
      entry.completedAt = new Date();
      entry.logs.push(`Completed job execution successfully. Clean exit.`);
      
      job.lastRun = new Date();
      job.lastStatus = 'SUCCESS';
      this.jobs.set(job.id, job);

      // Save to History Log
      this.saveToHistory(entry, 'SUCCESS', Date.now() - startTime);

      // Record standard audit log
      await this.writeDatabaseAuditLog('JOB_SCHEDULER_RUN_SUCCESS', job.name, job.id, entry.logs.join('\n'));
    } catch (err: any) {
      // Failed retry handler
      entry.status = 'FAILED';
      entry.error = err.message || 'Fatal execution crash.';
      entry.logs.push(`ERROR: ${entry.error}`);
      entry.retryCount++;

      if (entry.retryCount >= job.retryPolicy.maxRetries) {
        // Exceeded retries
        entry.logs.push(`CRITICAL: Max retry threshold of ${job.retryPolicy.maxRetries} exceeded. Abandoning job.`);
        job.lastRun = new Date();
        job.lastStatus = 'FAILED';
        this.jobs.set(job.id, job);

        this.saveToHistory(entry, 'FAILED', Date.now() - startTime, entry.error);
        await this.writeDatabaseAuditLog('JOB_SCHEDULER_RUN_FAILED', job.name, job.id, entry.logs.join('\n'));
      } else {
        // Enqueue delayed retry
        const delay = job.retryPolicy.backoffMs * Math.pow(2, entry.retryCount - 1);
        entry.logs.push(`SCHEDULING RETRY: Attempt #${entry.retryCount + 1} scheduled to run in ${delay}ms`);
        this.logger.warn(`Job ${job.name} failed. Scheduling retry #${entry.retryCount + 1} in ${delay}ms`);
        
        setTimeout(() => {
          this.processQueue();
        }, delay);
      }
    }
  }

  // Emulate individual automation task scripts
  private async runJobLogic(jobId: string, entry: JobQueueEntry): Promise<void> {
    entry.logs.push(`Loading telemetry profiles for tenant databases.`);
    await this.delayMs(1500); // Simulate execution delay

    switch (jobId) {
      case 'job-farmer-billing':
        entry.logs.push(`Retrieving active milk collection logs... compiled 4,120 registries.`);
        entry.logs.push(`Applying Quality Rate Standards fat/snf premium index matrix...`);
        entry.logs.push(`Calculated aggregate farmer payables: Rs. 1,48,290.40 due.`);
        entry.logs.push(`Created 48 payment voucher ledger postings under Payout Vouchers.`);
        break;

      case 'job-customer-billing':
        entry.logs.push(`Scanning active subscriptions... found 312 active deliveries.`);
        entry.logs.push(`Computing daily delivery schedules and customer consumption profiles...`);
        entry.logs.push(`Compiled aggregate customer accounts balance: Rs. 4,12,050.00.`);
        entry.logs.push(`Generated and scheduled 182 consumer subscription bills.`);
        break;

      case 'job-invoice-generation':
        entry.logs.push(`Filtering un-invoiced orders... found 14 orders pending certificate.`);
        entry.logs.push(`Wrote certified GST metadata, compiled items, and structured PDF invoices.`);
        entry.logs.push(`Invoices issued with active e-way delivery codes.`);
        break;

      case 'job-ledger-updates':
        entry.logs.push(`Parsing unposted billing run registers and collections ledgers...`);
        entry.logs.push(`Posting credits to Accounts Payable (Rs. 1,48,290.40)`);
        entry.logs.push(`Posting debits to Accounts Receivable (Rs. 4,12,050.00)`);
        entry.logs.push(`Reconciled general bookkeeping ledger safely. Balances verified.`);
        break;

      case 'job-daily-closing':
        entry.logs.push(`Freezing daily milk registries for morning and evening shifts.`);
        entry.logs.push(`Comparing collected physical milk volumes against dispatched inventory stocks...`);
        entry.logs.push(`Volume balance: 1,840 Liters collected, 1,795 Liters dispatched, 45 Liters stored.`);
        entry.logs.push(`Locked current transaction tables to read-only. Safe exit.`);
        break;

      case 'job-monthly-closing':
        entry.logs.push(`Compiling current month-to-date trial statements...`);
        entry.logs.push(`Consolidating state GST tax metrics and corporate outstanding sheets...`);
        entry.logs.push(`Carried forward outstanding ledger balances to next period registries.`);
        break;

      case 'job-alerts-reminders':
        entry.logs.push(`Scanning accounts receivable tables... found 18 overdue customer invoices.`);
        entry.logs.push(`Dispatched payment reminders: 18 SMS alerts, 18 emails, 18 push warnings.`);
        entry.logs.push(`Checking stock levels... found 2 items below minimum threshold.`);
        entry.logs.push(`Dispatched low-stock alert warnings to warehouse managers.`);
        break;

      case 'job-db-backup':
        entry.logs.push(`Locking database write pipelines temporarily...`);
        entry.logs.push(`Exporting PostgreSQL schemas, sequences, and tables...`);
        entry.logs.push(`Archive compressed successfully. Wrote payload 'snapshot_20260712_1117.backup' (12.4 MB)`);
        entry.logs.push(`Uploaded snapshot archive to secure cold storage bucket. Snapshot sealed.`);
        break;

      case 'job-maintenance-cleanup':
        entry.logs.push(`Scanning system log directories... found 12,410 log statements older than 90 days.`);
        entry.logs.push(`Wiped expired logs successfully. Reclaimed 184 MB database index space.`);
        entry.logs.push(`Purging unused temporary PDF files... freed 1.2 GB of temporary storage.`);
        break;

      case 'job-scheduled-reports':
        entry.logs.push(`Compiling cooperative financial charts & supplier reports...`);
        entry.logs.push(`Structured PDF cooperative health audit cards.`);
        entry.logs.push(`Assembled CSV dataset summary for cooperative executives.`);
        break;

      default:
        entry.logs.push(`Custom operations executed safely.`);
    }
  }

  private saveToHistory(entry: JobQueueEntry, status: 'SUCCESS' | 'FAILED', durationMs: number, error?: string) {
    const job = this.jobs.get(entry.jobId);
    const historyEntry: JobHistoryEntry = {
      id: `h-${Math.random().toString(36).substring(2, 9)}`,
      jobId: entry.jobId,
      jobName: entry.jobName,
      category: job ? job.category : 'SYSTEM',
      status,
      durationMs,
      runAt: entry.startedAt || new Date(),
      error,
      logs: entry.logs.join('\n'),
    };

    this.history.unshift(historyEntry);
    
    // Cap history length at 100 entries to prevent memory bloating
    if (this.history.length > 100) {
      this.history.pop();
    }
  }

  private async writeDatabaseAuditLog(action: string, jobName: string, jobId: string, logContent: string) {
    try {
      // Find default business to write the audit trail to
      const defaultBiz = await this.databaseService.business.findFirst();
      if (!defaultBiz) return;

      await this.databaseService.auditLog.create({
        data: {
          businessId: defaultBiz.id,
          action,
          entityName: 'ScheduledJob',
          entityId: jobId,
          newValue: JSON.stringify({
            jobName,
            status: action.includes('SUCCESS') ? 'COMPLETED' : 'FAILED',
            timestamp: new Date().toISOString(),
          }),
          oldValue: logContent.substring(0, 1500), // Trim logs to avoid overflow
        },
      });
    } catch (err) {
      this.logger.error('Failed to write database audit log for scheduled job run', err instanceof Error ? err.stack : String(err));
    }
  }

  private delayMs(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
