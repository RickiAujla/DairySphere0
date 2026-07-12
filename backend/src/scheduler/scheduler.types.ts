export interface JobDefinition {
  id: string;
  name: string;
  category: 'AUTOMATION' | 'BACKUPS' | 'REPORTS' | 'NOTIFICATIONS' | 'SYSTEM';
  description: string;
  cronExpression: string;
  nextRun: Date;
  lastRun?: Date;
  lastStatus?: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface JobQueueEntry {
  id: string;
  jobId: string;
  jobName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: string[];
}

export interface JobHistoryEntry {
  id: string;
  jobId: string;
  jobName: string;
  category: string;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  runAt: Date;
  error?: string;
  logs: string;
}
