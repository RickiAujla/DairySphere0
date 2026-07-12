import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, title, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast Render Portal Stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-blue-500 dark:text-blue-400';
          let borderClass = 'border-blue-100 dark:border-blue-900/50';
          let bgClass = 'bg-white dark:bg-slate-900';
          
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-teal-600 dark:text-teal-400';
            borderClass = 'border-teal-100 dark:border-teal-900/40';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-600 dark:text-rose-400';
            borderClass = 'border-rose-100 dark:border-rose-900/40';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-500 dark:text-amber-400';
            borderClass = 'border-amber-100 dark:border-amber-900/40';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 scale-100 animate-fade-in pointer-events-auto ${bgClass} ${borderClass}`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1 space-y-0.5">
                {toast.title && (
                  <p className="text-xs font-extrabold text-gray-900 dark:text-slate-100 uppercase tracking-tight">
                    {toast.title}
                  </p>
                )}
                <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be utilized within a ToastProvider');
  }
  return context;
};
