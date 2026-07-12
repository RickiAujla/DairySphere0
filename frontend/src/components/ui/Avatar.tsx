import React, { useState } from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[9px] font-black',
    sm: 'w-8 h-8 text-[11px] font-black',
    md: 'w-10 h-10 text-xs font-black',
    lg: 'w-12 h-12 text-sm font-black',
    xl: 'w-16 h-16 text-lg font-black',
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-white dark:ring-slate-900',
    offline: 'bg-slate-400 ring-white dark:ring-slate-900',
    busy: 'bg-rose-500 ring-white dark:ring-slate-900',
    away: 'bg-amber-500 ring-white dark:ring-slate-900',
  };

  const statusIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={`rounded-full object-cover border border-slate-200/60 dark:border-slate-800 ${sizes[size]}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-400 border border-teal-200 dark:border-teal-900/60 font-black tracking-tight ${sizes[size]}`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ${statusColors[status]} ${statusIndicatorSizes[size]}`}
        />
      )}
    </div>
  );
};
