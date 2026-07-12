import React from 'react';
import { Check } from 'lucide-react';

// ==========================================
// 1. REUSABLE CHECKBOX
// ==========================================
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked,
  onChange,
  className = '',
  disabled,
  id,
  ...props
}) => {
  const checkboxId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className="flex items-start gap-3 select-none">
      <div className="relative flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <div
          onClick={() => !disabled && onChange(!checked)}
          className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            checked
              ? 'bg-teal-650 border-teal-650 text-white dark:bg-teal-600 dark:border-teal-600'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>

      {(label || description) && (
        <div className="text-left">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`block text-[11px] font-bold tracking-wide cursor-pointer ${
                disabled ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. REUSABLE RADIO GROUP
// ==========================================
export interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  selectedValue,
  onChange,
  disabled = false,
  name,
}) => {
  return (
    <div className="space-y-2 select-none">
      {label && (
        <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
          {label}
        </span>
      )}

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = opt.value === selectedValue;
          return (
            <div
              key={opt.value}
              onClick={() => !disabled && onChange(opt.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'border-teal-500/50 bg-teal-50/10 dark:bg-teal-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-white dark:bg-slate-900/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="h-5 flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                    isSelected
                      ? 'border-teal-650 dark:border-teal-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 bg-teal-650 dark:bg-teal-500 rounded-full" />
                  )}
                </div>
              </div>

              <div className="text-left">
                <span className="block text-[10px] font-bold text-gray-900 dark:text-slate-200">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="block text-[9px] text-gray-400 dark:text-slate-500 font-medium">
                    {opt.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. REUSABLE SWITCH (Toggle Switch)
// ==========================================
export interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 select-none">
      {(label || description) && (
        <div className="text-left flex-1">
          {label && (
            <span className={`block text-[11px] font-bold ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-slate-200'}`}>
              {label}
            </span>
          )}
          {description && (
            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium leading-normal mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${
          checked ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

// ==========================================
// 4. REUSABLE SLIDER
// ==========================================
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
            {label}
          </label>
        )}
        <span className="text-[10px] font-bold font-mono text-teal-650 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-md">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
};
