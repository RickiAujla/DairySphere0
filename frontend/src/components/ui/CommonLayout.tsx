import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

// ==========================================
// 1. PAGE CONTAINER (FLUID MAX-WIDTH WRAPPER)
// ==========================================
export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
      {children}
    </div>
  );
};

// ==========================================
// 2. LAYOUT SECTION PANEL
// ==========================================
export interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  actions,
  className = '',
}) => {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="text-left space-y-0.5">
            {title && (
              <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
        </div>
      )}
      <div className="text-left">{children}</div>
    </section>
  );
};

// ==========================================
// 3. RESPONSIVE GRID COLUMNS
// ==========================================
export interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className = '',
}) => {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
  };

  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-5',
    lg: 'gap-8',
  };

  return (
    <div className={`grid ${colStyles[cols]} ${gapStyles[gap]} ${className}`}>
      {children}
    </div>
  );
};

// ==========================================
// 4. VERTICAL OR HORIZONTAL STACK (FLEXBOX)
// ==========================================
export interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'col',
  align = 'stretch',
  justify = 'start',
  gap = 'sm',
  className = '',
}) => {
  const directions = {
    row: 'flex-row items-center',
    col: 'flex-col',
  };

  const aligns = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifies = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  const gaps = {
    none: 'gap-0',
    xs: 'gap-1.5',
    sm: 'gap-3',
    md: 'gap-5',
    lg: 'gap-8',
  };

  return (
    <div className={`flex ${directions[direction]} ${aligns[align]} ${justifies[justify]} ${gaps[gap]} ${className}`}>
      {children}
    </div>
  );
};

// ==========================================
// 5. REUSABLE DIVIDER WITH INNER TEXT
// ==========================================
export interface DividerProps {
  children?: React.ReactNode;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative flex py-3 items-center select-none ${className}`}>
      <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
      {children && (
        <span className="flex-shrink mx-4 text-[8px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest">
          {children}
        </span>
      )}
      <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
    </div>
  );
};

// ==========================================
// 6. BREADCRUMB INDICATOR NAVIGATOR
// ==========================================
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
      <div className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 shrink-0 cursor-pointer">
        <Home className="w-3.5 h-3.5" />
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300" />

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            <button
              type="button"
              disabled={isLast || !item.onClick}
              onClick={item.onClick}
              className={`px-1.5 py-0.5 rounded-md transition ${
                isLast
                  ? 'text-teal-600 dark:text-teal-400 font-extrabold cursor-default'
                  : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
              }`}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ==========================================
// 7. COMPACT HEADER PAGE TITLE COMPONENT
// ==========================================
export interface PageTitleProps {
  badgeText?: string;
  title: string;
  subtitle?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  badgeText,
  title,
  subtitle,
}) => {
  return (
    <div className="text-left space-y-1">
      {badgeText && (
        <span className="inline-block px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/45 text-teal-800 dark:text-teal-400 text-[8px] font-extrabold tracking-widest uppercase rounded-md leading-none">
          {badgeText}
        </span>
      )}
      <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest leading-none">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
};

// ==========================================
// 8. PAGE ACTIONS SHELF
// ==========================================
export interface PageActionsProps {
  children: React.ReactNode;
}

export const PageActions: React.FC<PageActionsProps> = ({ children }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
      {children}
    </div>
  );
};
