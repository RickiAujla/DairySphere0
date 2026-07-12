import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  borderVariant?: 'default' | 'accent' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  borderVariant = 'default',
  className = '',
  ...props
}) => {
  const borders = {
    default: 'border border-slate-200/80 dark:border-slate-800/80',
    accent: 'border-l-4 border-l-teal-500 border border-slate-200/80 dark:border-slate-800/80',
    none: 'border-0',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs transition-all duration-200 ${
        borders[borderVariant]
      } ${
        hoverEffect 
          ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:translate-y-[-1px]' 
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h4 className={`text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest ${className}`} {...props}>
    {children}
  </h4>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-[10px] text-gray-400 dark:text-slate-500 font-medium ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);
