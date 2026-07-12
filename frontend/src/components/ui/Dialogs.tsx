import React, { useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Info } from 'lucide-react';

// ==========================================
// 1. GENERIC MODAL / DIALOG COMPONENT
// ==========================================
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
  size = 'md',
}) => {
  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal box */}
      <div
        className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in-50 zoom-in-95 duration-200 ${sizes[size]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80">
          <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
            {title}
          </h4>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] text-[11px] text-gray-650 dark:text-slate-300 leading-relaxed font-medium">
          {children}
        </div>

        {/* Footer actions */}
        {footerActions && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. CONFIRM DIALOG OVERLAY
// ==========================================
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm action',
  cancelText = 'Discard',
}) => {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footerActions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase shadow-xs transition"
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-3.5 items-start">
        <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-650 rounded-xl">
          <Info className="w-5 h-5" />
        </div>
        <p className="text-[11px] text-gray-600 dark:text-slate-350 leading-relaxed">
          {message}
        </p>
      </div>
    </Dialog>
  );
};

// ==========================================
// 3. ALERT DIALOG OVERLAY
// ==========================================
export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
  title: string;
  message: string;
  actionText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  onAction,
  title,
  message,
  actionText = 'Acknowledge alert',
}) => {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footerActions={
        <button
          onClick={() => {
            if (onAction) onAction();
            onClose();
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase shadow-xs transition"
        >
          {actionText}
        </button>
      }
    >
      <div className="flex gap-3.5 items-start">
        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-650 rounded-xl">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <p className="text-[11px] text-gray-650 dark:text-slate-350 leading-relaxed">
          {message}
        </p>
      </div>
    </Dialog>
  );
};

// ==========================================
// 4. DRAWER / SHEET SLIDE OUT (RIGHT PANEL)
// ==========================================
export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Slide panel */}
      <div
        className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-100 dark:border-slate-800/80">
          <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
            {title}
          </h4>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footerActions && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
