import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  description,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500'
            : 'border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20'
        } rounded-xl shadow-xs transition placeholder-gray-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-3 ${className}`}
        {...props}
      />

      {description && !error && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}

      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
