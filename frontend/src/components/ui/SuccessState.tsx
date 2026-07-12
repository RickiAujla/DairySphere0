import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export interface SuccessStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  loading = false,
}) => {
  return (
    <div className="p-6 border border-teal-100 dark:border-teal-950/40 bg-teal-50/50 dark:bg-teal-950/10 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
      <div className="p-2.5 bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-1">
        <h5 className="text-xs font-black text-teal-900 dark:text-teal-400 uppercase tracking-wider">
          {title}
        </h5>
        <p className="text-[10px] text-teal-700/80 dark:text-teal-300/80 leading-relaxed font-medium">
          {message}
        </p>
        {onAction && actionLabel && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="xs"
              onClick={onAction}
              loading={loading}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
