import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info, AlertCircle, LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';

// ==========================================
// 1. KPI CARD WITH TREND INDEX
// ==========================================
export interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number; // e.g. 12.5 for 12.5%
    isPositive: boolean;
    timeframe?: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  trend,
  icon,
  className = '',
}) => {
  return (
    <Card hoverEffect className={`relative overflow-hidden ${className}`}>
      {/* Decorative top ambient color strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block truncate">
            {title}
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight block font-mono">
            {value}
          </span>
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono leading-none ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{trend.value}%</span>
          </span>
        )}
        {(description || (trend && trend.timeframe)) && (
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            {description || `vs last ${trend?.timeframe || 'month'}`}
          </span>
        )}
      </div>
    </Card>
  );
};

// ==========================================
// 2. STATISTICS LIST CARD
// ==========================================
export interface StatItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface StatisticsCardProps {
  title: string;
  items: StatItem[];
  footerNote?: string;
  className?: string;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  items,
  footerNote,
  className = '',
}) => {
  return (
    <Card hoverEffect className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.label + idx}
            className="flex items-center justify-between border-b border-slate-50 dark:border-slate-805/40 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0"
          >
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-450 uppercase tracking-wide">
              {item.label}
            </span>
            <span
              className={`text-[11px] font-bold font-mono ${
                item.highlight
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-gray-900 dark:text-slate-200'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
        {footerNote && (
          <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-4">
            * {footerNote}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// ==========================================
// 3. INFORMATION BANNER CARD
// ==========================================
export interface InformationCardProps {
  title: string;
  description: string;
  variant?: 'info' | 'warning' | 'audit';
  actionButton?: React.ReactNode;
}

export const InformationCard: React.FC<InformationCardProps> = ({
  title,
  description,
  variant = 'info',
  actionButton,
}) => {
  const themes = {
    info: {
      border: 'border-blue-200 dark:border-blue-900/60',
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      iconColor: 'text-blue-550 dark:text-blue-400',
    },
    warning: {
      border: 'border-amber-200 dark:border-amber-900/60',
      bg: 'bg-amber-50/50 dark:bg-amber-950/20',
      iconColor: 'text-amber-550 dark:text-amber-400',
    },
    audit: {
      border: 'border-teal-200 dark:border-teal-900/60',
      bg: 'bg-teal-50/50 dark:bg-teal-950/20',
      iconColor: 'text-teal-550 dark:text-teal-400',
    },
  };

  const activeTheme = themes[variant];

  return (
    <div className={`p-4 border rounded-2xl flex gap-3.5 items-start ${activeTheme.border} ${activeTheme.bg}`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${activeTheme.iconColor}`}>
        {variant === 'warning' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <Info className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h5 className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
          {title}
        </h5>
        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold leading-relaxed leading-normal">
          {description}
        </p>
        {actionButton && <div className="pt-2">{actionButton}</div>}
      </div>
    </div>
  );
};

// ==========================================
// 4. ILLUSTRATIVE FEATURE CARD
// ==========================================
export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onAction?: () => void;
  actionText?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  onAction,
  actionText = 'Configure module',
  className = '',
}) => {
  return (
    <Card hoverEffect className={`flex flex-col h-full ${className}`}>
      <div className="p-3.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/5 text-teal-600 dark:text-teal-400 border border-teal-500/10 w-fit mb-4">
        {icon}
      </div>
      <div className="flex-1 space-y-1.5 mb-6">
        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
          {title}
        </h4>
        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold leading-normal">
          {description}
        </p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:underline text-left mt-auto cursor-pointer"
        >
          {actionText} →
        </button>
      )}
    </Card>
  );
};
