import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

// ==========================================
// 1. REUSABLE SEPARATOR
// ==========================================
export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-100 dark:bg-slate-800 ${
        orientation === 'horizontal' ? 'h-px w-full my-4' : 'w-px h-full mx-4 self-stretch'
      } ${className}`}
    />
  );
};

// ==========================================
// 2. REUSABLE TOOLTIP
// ==========================================
export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [show, setShow] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`absolute z-50 whitespace-nowrap bg-slate-950 text-white text-[9px] font-bold tracking-wide uppercase px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 ${positionStyles[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. REUSABLE POPOVER
// ==========================================
export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ trigger, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 w-64 animate-in fade-in-50 slide-in-from-top-1 ${className}`}>
          {children}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. REUSABLE ACCORDION
// ==========================================
export interface AccordionItem {
  id: string;
  trigger: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
}

export const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-805 bg-white dark:bg-slate-900/40 overflow-hidden">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div key={item.id} className="transition-colors">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 text-left text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <span>{item.trigger}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isOpen && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-gray-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 5. REUSABLE PROGRESS BAR
// ==========================================
export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  showPercentage?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className = '',
  showPercentage = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full space-y-1">
      {showPercentage && (
        <div className="flex justify-end">
          <span className="text-[10px] font-mono font-black text-teal-650 dark:text-teal-400">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden ${className}`}>
        <div
          className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

// ==========================================
// 6. REUSABLE SPINNER
// ==========================================
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 className={`animate-spin text-teal-600 dark:text-teal-400 ${sizes[size]} ${className}`} />
  );
};
