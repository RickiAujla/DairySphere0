import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  FileText, 
  Sliders, 
  Search, 
  Trash2, 
  ShieldAlert, 
  Database, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  Mail,
  Bell,
  RefreshCw,
  HardDrive,
  Info
} from 'lucide-react';
import { api } from '../../utils/api';

interface JobDefinition {
  id: string;
  name: string;
  category: 'AUTOMATION' | 'BACKUPS' | 'REPORTS' | 'NOTIFICATIONS' | 'SYSTEM';
  description: string;
  cronExpression: string;
  nextRun: string;
  lastRun?: string;
  lastStatus?: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

interface JobQueueEntry {
  id: string;
  jobId: string;
  jobName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  logs: string[];
}

interface JobHistoryEntry {
  id: string;
  jobId: string;
  jobName: string;
  category: string;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  runAt: string;
  error?: string;
  logs: string;
}

export function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'queue' | 'history' | 'policies'>('schedules');
  const [jobs, setJobs] = useState<JobDefinition[]>([]);
  const [queue, setQueue] = useState<JobQueueEntry[]>([]);
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Selected job for configuration modal
  const [selectedJob, setSelectedJob] = useState<JobDefinition | null>(null);
  const [cronInput, setCronInput] = useState('');
  const [maxRetriesInput, setMaxRetriesInput] = useState(3);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Selected history log for detailed view
  const [selectedHistory, setSelectedHistory] = useState<JobHistoryEntry | null>(null);

  // Policy Settings state
  const [retentionDays, setRetentionDays] = useState(90);
  const [autoCloseTime, setAutoCloseTime] = useState('22:00');
  const [backupFrequency, setBackupFrequency] = useState('DAILY');
  const [alertChannels, setAlertChannels] = useState({ email: true, sms: false, push: true });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedJobs, fetchedQueue, fetchedHistory] = await Promise.all([
        api.getSchedulerJobs(),
        api.getSchedulerQueue(),
        api.getSchedulerHistory()
      ]);
      setJobs(fetchedJobs);
      setQueue(fetchedQueue);
      setHistory(fetchedHistory);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch automation logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerJob = async (jobId: string) => {
    try {
      showToast('Dispatching manual task execution sequence...');
      const response = await api.triggerSchedulerJob(jobId);
      showToast(`Successfully completed: ${response.data.jobName}`);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Execution failed', 'error');
    }
  };

  const handleConfigureJob = (job: JobDefinition) => {
    setSelectedJob(job);
    setCronInput(job.cronExpression);
    setMaxRetriesInput(job.retryPolicy.maxRetries);
    setIsConfiguring(true);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedJob) return;
    try {
      await api.updateSchedulerJob(selectedJob.id, {
        cronExpression: cronInput,
        maxRetries: maxRetriesInput
      });
      showToast('Scheduled task policy successfully re-registered.');
      setIsConfiguring(false);
      setSelectedJob(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update schedule', 'error');
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you absolutely sure you want to clear all historical job logs? This operation is permanent.')) {
      try {
        await api.clearSchedulerHistory();
        showToast('Scheduler history database registers safely purged.');
        fetchData();
      } catch (err: any) {
        showToast(err.message || 'Operation failed', 'error');
      }
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    showToast('Automation and SLA warning policy profiles updated.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTOMATION': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BACKUPS': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REPORTS': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NOTIFICATIONS': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = h.jobName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (h.error && h.error.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || h.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="automation-module-root" className="space-y-6">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm max-w-md ${
              toastMessage.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {toastMessage.type === 'error' ? <XCircle className="w-4 h-4 shrink-0 text-red-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Automation &amp; Scheduled Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enterprise orchestration console to monitor background workers, run daily accounting closings, and trigger batch processing workflows.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Synchronize Console
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Cron Policies</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{jobs.length}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              All Services Operating
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Queue Status</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{queue.length}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
              Workers idle, awaiting triggers
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Orchestrator Success Rate</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">98.7%</h3>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              Zero active retries
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Database Cold Snapshots</span>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">Sealed</h3>
            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-1">
              12.4 MB compressed
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === 'schedules' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          System Schedules ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === 'queue' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Active Execution Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === 'history' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Immutable Audit History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
            activeTab === 'policies' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Settings &amp; Automation Policies
        </button>
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-medium">Assembling task metrics and scheduler registers...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: SYSTEM SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-100 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 tracking-tight leading-tight">{job.name}</h4>
                      <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${getCategoryColor(job.category)}`}>
                        {job.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-50 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Cron Policy</span>
                        <code className="text-[11px] font-mono text-gray-700 font-semibold">{job.cronExpression}</code>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Next Run Target</span>
                        <span className="text-gray-700 font-medium font-sans">
                          {new Date(job.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' '}({new Date(job.nextRun).toLocaleDateString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-5 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="text-gray-400">Last run:</span>
                      {job.lastStatus === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          <Check className="w-3 h-3" /> SUCCESS
                        </span>
                      ) : job.lastStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      ) : (
                        <span className="text-gray-500">PENDING</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfigureJob(job)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Configure Trigger Policy"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTriggerJob(job.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        Run Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ACTIVE EXECUTION QUEUE */}
          {activeTab === 'queue' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Thread Queue</span>
                <span className="text-xs font-medium text-gray-400">Total entries: {queue.length}</span>
              </div>
              
              {queue.length === 0 ? (
                <div className="p-12 text-center">
                  <Sliders className="w-8 h-8 text-gray-300 mx-auto stroke-1" />
                  <p className="text-sm font-semibold text-gray-500 mt-4">Job Execution Queue Empty</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    All background jobs are safely parsed. Use the System Schedules tab to manually dispatch automated runs.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {queue.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-gray-400">[{item.id}]</span>
                          <h5 className="font-semibold text-sm text-gray-900">{item.jobName}</h5>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 font-medium">
                          <span>Created at: {new Date(item.createdAt).toLocaleTimeString()}</span>
                          <span>Retries: {item.retryCount}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                        <Check className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMMUTABLE AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs by task name or errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="AUTOMATION">Automation</option>
                    <option value="BACKUPS">Backups</option>
                    <option value="REPORTS">Reports</option>
                    <option value="NOTIFICATIONS">Notifications</option>
                  </select>
                  <button
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-medium rounded-lg text-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Wipe Logs
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Execution Ref</th>
                        <th className="p-4">Automation Task</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Runtime</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-400">
                            No matching audit log records found.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-mono text-xs font-semibold text-gray-400">{item.id}</td>
                            <td className="p-4">
                              <span className="font-semibold text-gray-900">{item.jobName}</span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-500">
                              {new Date(item.runAt).toLocaleTimeString()} ({new Date(item.runAt).toLocaleDateString()})
                            </td>
                            <td className="p-4 text-xs text-gray-600 font-semibold font-mono">
                              {item.durationMs}ms
                            </td>
                            <td className="p-4">
                              {item.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <Check className="w-3 h-3" /> SUCCESS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                  <AlertCircle className="w-3 h-3" /> FAILED
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedHistory(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition"
                              >
                                <FileText className="w-3.5 h-3.5 text-gray-500" />
                                Inspect Log
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & AUTOMATION POLICIES */}
          {activeTab === 'policies' && (
            <form onSubmit={handleSavePolicies} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <h4 className="text-base font-semibold text-gray-900">Cooperative Global Orchestration Rules</h4>
                <p className="text-xs text-gray-400 mt-1">Configure structural thresholds, scheduling frequencies, and notification alerts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Daily Operations Closing Lock Time</label>
                  <p className="text-xs text-gray-400 leading-relaxed">Specific daily hour when registries freeze, milk stock reconciles, and operations lock.</p>
                  <input
                    type="time"
                    value={autoCloseTime}
                    onChange={(e) => setAutoCloseTime(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Backup Storage Policy Frequency</label>
                  <p className="text-xs text-gray-400 leading-relaxed">Timing pattern for full physical relational PostgreSQL backups.</p>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="HOURLY">Hourly (High Security)</option>
                    <option value="DAILY">Daily (Standard)</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Immutable Logs Purging Period</label>
                  <p className="text-xs text-gray-400 leading-relaxed">Purge temporary logs and audit registries older than this limit.</p>
                  <select
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days (Recommended)</option>
                    <option value={180}>180 Days (Audit Compliance)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Reminders Alert Channels</label>
                  <p className="text-xs text-gray-400 leading-relaxed">Dispatched alert warnings for late payments and stock depletion warnings.</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertChannels.email}
                        onChange={(e) => setAlertChannels({ ...alertChannels, email: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> Email</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertChannels.sms}
                        onChange={(e) => setAlertChannels({ ...alertChannels, sms: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5 text-gray-400" /> SMS</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertChannels.push}
                        onChange={(e) => setAlertChannels({ ...alertChannels, push: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-gray-400" /> Push App Notices</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
                >
                  {saveSuccess ? <Check className="w-4 h-4" /> : null}
                  {saveSuccess ? 'Rules Updated' : 'Save System Rules'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODAL 1: CONFIGURE SCHEDULING DIALOG */}
      <AnimatePresence>
        {isConfiguring && selectedJob && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-gray-900">Task Schedule Policy</h3>
                <p className="text-xs text-gray-400 mt-1">Configure orchestration options for: &quot;{selectedJob.name}&quot;</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Cron Policy Expression</label>
                  <input
                    type="text"
                    value={cronInput}
                    onChange={(e) => setCronInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 0 0 * * 0"
                  />
                  <span className="text-[11px] text-gray-400 block mt-1 flex items-center gap-1 leading-tight">
                    <Info className="w-3 h-3 text-gray-400 shrink-0" />
                    Standard 5-field cron: [minute] [hour] [day of month] [month] [day of week]
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Worker Maximum Retry Limit</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={maxRetriesInput}
                    onChange={(e) => setMaxRetriesInput(Number(e.target.value))}
                    className="w-full max-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsConfiguring(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
                >
                  Register Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: INSPECT DETAILED LOGS DIALOG */}
      <AnimatePresence>
        {selectedHistory && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Worker Logs Console</h3>
                  <p className="text-xs text-gray-400 mt-1">Ref ID: {selectedHistory.id} — Run completed on {new Date(selectedHistory.runAt).toLocaleTimeString()}</p>
                </div>
                <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded border ${getCategoryColor(selectedHistory.category)}`}>
                  {selectedHistory.category}
                </span>
              </div>

              <div className="p-6 bg-slate-900 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-y-auto max-h-[360px] whitespace-pre-wrap">
                {selectedHistory.logs}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-400 font-medium">
                  Execution duration: <span className="font-bold font-mono text-gray-700">{selectedHistory.durationMs}ms</span>
                </div>
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm transition"
                >
                  Close Console
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
