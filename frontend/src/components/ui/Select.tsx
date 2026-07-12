import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

// ==========================================
// 1. STANDARD SELECT
// ==========================================
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  description,
  options,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none px-4 py-2.5 text-[11px] font-bold text-gray-950 dark:text-slate-100 bg-white dark:bg-slate-900 border ${
            error
              ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20'
          } rounded-xl shadow-xs transition focus:outline-hidden focus:ring-3 pr-10 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 dark:text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {description && !error && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}

      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
};

// ==========================================
// 2. MULTI SELECT COMPONENT
// ==========================================
export interface MultiSelectProps {
  label?: string;
  error?: string;
  description?: string;
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  error,
  description,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select items...',
}) => {
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

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  return (
    <div className="space-y-1.5 w-full relative" ref={containerRef}>
      {label && (
        <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest select-none">
          {label}
        </span>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] px-3.5 py-2 flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500 dark:border-rose-500/80'
            : 'border-slate-200 dark:border-slate-800'
        } rounded-xl shadow-xs transition cursor-pointer select-none`}
      >
        {selectedValues.length === 0 ? (
          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
            {placeholder}
          </span>
        ) : (
          selectedValues.map((val) => {
            const opt = options.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 text-[10px] font-bold rounded-lg border border-teal-100 dark:border-teal-900/40"
              >
                {opt ? opt.label : val}
                <button
                  type="button"
                  onClick={(e) => removeValue(val, e)}
                  className="hover:bg-teal-150 p-0.5 rounded-md text-teal-600 dark:text-teal-400"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })
        )}
        <div className="ml-auto text-gray-400 dark:text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 max-h-52 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-[11px] font-bold transition ${
                  isSelected
                    ? 'bg-teal-50/50 dark:bg-teal-950/20 text-teal-850 dark:text-teal-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {description && !error && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}

      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
};

// ==========================================
// 3. COMBOBOX COMPONENT (Searchable)
// ==========================================
export interface ComboboxProps {
  label?: string;
  error?: string;
  description?: string;
  options: SelectOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  error,
  description,
  options,
  selectedValue,
  onChange,
  placeholder = 'Select option...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  const selectedOpt = options.find((o) => o.value === selectedValue);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-1.5 w-full relative" ref={containerRef}>
      {label && (
        <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest select-none">
          {label}
        </span>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500 dark:border-rose-500/80'
            : 'border-slate-200 dark:border-slate-800'
        } rounded-xl shadow-xs transition cursor-pointer select-none`}
      >
        <span className={`text-[11px] font-bold ${selectedOpt ? 'text-gray-950 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}`}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-1 max-h-60 overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search option..."
              className="w-full bg-transparent border-0 outline-hidden text-[11px] font-bold text-gray-900 dark:text-slate-100 focus:ring-0 p-0"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 py-1">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                No items found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-[11px] font-bold transition ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {description && !error && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
          {description}
        </p>
      )}

      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
};
