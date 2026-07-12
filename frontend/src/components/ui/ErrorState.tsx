import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  errorCode?: string;
  retryLabel?: string;
  onRetry?: () => void;
  loading?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An Error Occurred',
  message,
  errorCode,
  retryLabel = 'Try Again',
  onRetry,
  loading = false,
}) => {
  return (
    <div className="p-6 border border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
      <div className="p-2.5 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h5 className="text-xs font-black text-rose-900 dark:text-rose-400 uppercase tracking-wider">
            {title}
          </h5>
          {errorCode && (
            <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded text-[8px] font-mono font-bold uppercase">
              Code: {errorCode}
            </span>
          )}
        </div>
        <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed font-medium">
          {message}
        </p>
        {onRetry && (
          <div className="pt-2">
            <Button
              variant="danger"
              size="xs"
              icon={<RefreshCw className="w-3 h-3" />}
              onClick={onRetry}
              loading={loading}
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
