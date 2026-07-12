import React from 'react';
import { X } from 'lucide-react';

// ==========================================
// 1. REUSABLE BADGE
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'slate' | 'rose' | 'amber' | 'blue' | 'purple';
  size?: 'xs' | 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'sm',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-extrabold uppercase tracking-widest rounded-full border leading-none';

  const variants = {
    teal: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/40',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700',
    rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[8px]',
    sm: 'px-2.5 py-1 text-[9px]',
    md: 'px-3 py-1.5 text-[10px]',
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 2. REUSABLE CHIP (WITH REMOVABLE BUTTON)
// ==========================================
export interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: 'teal' | 'slate' | 'rose' | 'amber' | 'blue';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  onRemove,
  variant = 'teal',
}) => {
  const variants = {
    teal: 'bg-teal-500/10 text-teal-850 dark:text-teal-400 border-teal-500/20',
    slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    rose: 'bg-rose-500/10 text-rose-850 dark:text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-850 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-850 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${variants[variant]}`}>
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// ==========================================
// 3. REUSABLE TAG (STATIC CATEGORY INDICATOR)
// ==========================================
export interface TagProps {
  text: string;
  dotColor?: string;
}

export const Tag: React.FC<TagProps> = ({ text, dotColor = 'bg-teal-550' }) => {
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 px-2 py-0.5 rounded-md">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{text}</span>
    </span>
  );
};
