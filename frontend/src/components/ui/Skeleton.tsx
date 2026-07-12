import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'shimmer' | 'none';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const shapes = {
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    text: 'rounded-sm h-3 w-3/4 my-1.5',
  };

  const animations = {
    pulse: 'animate-pulse bg-slate-200 dark:bg-slate-800',
    shimmer: 'relative overflow-hidden bg-slate-200 dark:bg-slate-800 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent',
    none: 'bg-slate-200 dark:bg-slate-800',
  };

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`${shapes[variant]} ${animations[animation]} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

export const SkeletonFeed: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
};
