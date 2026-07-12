import React from 'react';
import { Loader2, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ==========================================
// 1. REUSABLE INLINE ALERT BANNER
// ==========================================
export interface AlertProps {
  title: string;
  description?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  variant = 'info',
  className = '',
}) => {
  const styles = {
    info: {
      bg: 'bg-blue-50/55 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900/60',
      text: 'text-blue-800 dark:text-blue-400',
      icon: <Info className="w-4.5 h-4.5 shrink-0 text-blue-550 dark:text-blue-400" />,
    },
    success: {
      bg: 'bg-emerald-50/55 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      text: 'text-emerald-800 dark:text-emerald-400',
      icon: <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-550 dark:text-emerald-400" />,
    },
    warning: {
      bg: 'bg-amber-50/55 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/60',
      text: 'text-amber-800 dark:text-amber-400',
      icon: <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-550 dark:text-amber-400" />,
    },
    error: {
      bg: 'bg-rose-50/55 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-900/60',
      text: 'text-rose-800 dark:text-rose-400',
      icon: <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-550 dark:text-rose-400" />,
    },
  };

  const config = styles[variant];

  return (
    <div className={`p-4 border rounded-2xl flex gap-3 ${config.bg} ${config.border} ${className}`}>
      {config.icon}
      <div className="flex-1 min-w-0 text-left">
        <h5 className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
          {title}
        </h5>
        {description && (
          <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold leading-relaxed mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. REUSABLE BLOCK LOADING STATE
// ==========================================
export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Resolving Secure Tenant Schema context...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-4">
        {message}
      </span>
    </div>
  );
};
