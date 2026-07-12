import React, { createContext, useContext, useState, useCallback } from 'react';
import { HelpCircle, AlertTriangle, Info, X } from 'lucide-react';

interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'warning' | 'danger';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextType {
  confirm: (options: DialogOptions) => void;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDialog, setActiveDialog] = useState<DialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: DialogOptions) => {
    setActiveDialog(options);
    setIsOpen(true);
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setActiveDialog(null);
    }, 200); // Wait for transition out
  }, []);

  const handleConfirm = async () => {
    if (!activeDialog) return;
    if (activeDialog.onConfirm) {
      try {
        setLoading(true);
        await activeDialog.onConfirm();
      } catch (err) {
        console.error('Error in dialog confirmation callback:', err);
      } finally {
        setLoading(false);
      }
    }
    close();
  };

  const handleCancel = () => {
    if (activeDialog?.onCancel) {
      activeDialog.onCancel();
    }
    close();
  };

  return (
    <DialogContext.Provider value={{ confirm, close }}>
      {children}
      {/* Modal Overlay and Container */}
      {isOpen && activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade-in */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={handleCancel}
          />
          
          {/* Modal Card with pop animation */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-50 zoom-in-95">
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${
                activeDialog.type === 'danger' 
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                  : activeDialog.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
              }`}>
                {activeDialog.type === 'danger' && <AlertTriangle className="w-6 h-6" />}
                {activeDialog.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                {activeDialog.type === 'info' && <Info className="w-6 h-6" />}
                {!activeDialog.type && <HelpCircle className="w-6 h-6" />}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">
                  {activeDialog.title}
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                  {activeDialog.message}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-[10px] font-bold text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 uppercase tracking-wider transition disabled:opacity-50"
              >
                {activeDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 text-[10px] font-bold text-white rounded-xl shadow-xs uppercase tracking-wider transition disabled:opacity-50 ${
                  activeDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                    : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800'
                }`}
              >
                {loading ? 'Processing...' : (activeDialog.confirmLabel || 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be utilized within a DialogProvider');
  }
  return context;
};
