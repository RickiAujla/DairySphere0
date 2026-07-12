import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AuditLog, ActivityLog } from '../types';
import { ShieldAlert, Activity, Loader2, Calendar, User, Database, ChevronDown, ChevronUp } from 'lucide-react';

export const AuditActivityLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'activity'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'audit') {
          const data = await api.getAuditLogs();
          setAuditLogs(data);
        } else {
          const data = await api.getActivityLogs();
          setActivityLogs(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve logs.');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [activeTab]);

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Governance & Activity Streams
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse real-time database state audits, administrator activities, and tenant changes.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl max-w-xs shrink-0 select-none">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-teal-700 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Technical Auditing
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'activity'
                ? 'bg-white text-teal-700 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Activity Feed
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <span className="text-sm text-gray-500 mt-4 font-semibold">Retrieving journal entries...</span>
        </div>
      ) : activeTab === 'audit' ? (
        auditLogs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No audit log records found for this tenant.</p>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-all bg-slate-50/20">
                  <div
                    onClick={() => toggleExpandLog(log.id)}
                    className="flex items-center justify-between p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase font-mono rounded bg-teal-50 border border-teal-100 text-teal-700">
                        {log.action}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{log.entityName}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {log.user?.name || 'System'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (log.oldValue || log.newValue) && (
                    <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/50 p-4 font-mono text-xs text-gray-600 space-y-3">
                      {log.oldValue && (
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Previous Database State:</div>
                          <pre className="bg-white p-3 rounded-lg border border-gray-100 overflow-auto max-h-40">{JSON.stringify(JSON.parse(log.oldValue), null, 2)}</pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Database State:</div>
                          <pre className="bg-white p-3 rounded-lg border border-gray-100 overflow-auto max-h-40">{JSON.stringify(JSON.parse(log.newValue), null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : activityLogs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">No activity feed records found for this tenant.</p>
      ) : (
        <div className="relative border-l border-gray-100 ml-3.5 pl-6 space-y-6">
          {activityLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-teal-600 ring-4 ring-teal-50 transition-all group-hover:scale-110" />
              
              <div className="space-y-1 bg-gray-50/30 border border-gray-100 p-4 rounded-2xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-gray-100 text-gray-600 border border-gray-200">
                    {log.type}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">{log.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
