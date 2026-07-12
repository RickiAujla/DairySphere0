import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
  actionLabel,
  onAction,
  loading = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xs mb-4">
        {icon}
      </div>
      <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest mb-1.5">
        {title}
      </h4>
      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} loading={loading}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
