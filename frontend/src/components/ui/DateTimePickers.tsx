import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';

// ==========================================
// 1. INLINE CALENDAR GRID COMPONENT
// ==========================================
export interface CalendarProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Get array of days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days: (number | null)[] = [];
  // Padding for first week days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md select-none">
      {/* Header Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase text-gray-900 dark:text-slate-100 tracking-wider">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const daySelected = isSelected(day);
          const dayToday = isToday(day);

          return (
            <button
              key={`day-${day}`}
              onClick={() => onSelectDate(new Date(year, month, day))}
              className={`h-7 w-7 text-[10px] font-bold rounded-lg flex items-center justify-center transition cursor-pointer ${
                daySelected
                  ? 'bg-teal-650 text-white dark:bg-teal-500'
                  : dayToday
                  ? 'border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50/20'
                  : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 2. DROPDOWN DATE PICKER COMPONENT
// ==========================================
export interface DatePickerProps {
  label?: string;
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  error?: string;
  description?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  selectedDate,
  onSelectDate,
  error,
  description,
  placeholder = 'Pick cooperative date...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-1.5 w-full relative" ref={dropdownRef}>
      {label && (
        <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest select-none">
          {label}
        </span>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 focus:border-teal-500'
        } rounded-xl shadow-xs transition cursor-pointer select-none`}
      >
        <span className={`text-[11px] font-bold ${selectedDate ? 'text-gray-950 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}`}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              onSelectDate(date);
              setIsOpen(false);
            }}
          />
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
// 3. TIME PICKER COMPONENT
// ==========================================
export interface TimePickerProps {
  label?: string;
  value: string; // "12:00" format
  onChange: (value: string) => void;
  error?: string;
  description?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  description,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hours, minutes] = value.split(':').map(Number);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setHourValue = (h: number) => {
    const minStr = String(minutes || 0).padStart(2, '0');
    onChange(`${String(h).padStart(2, '0')}:${minStr}`);
  };

  const setMinuteValue = (m: number) => {
    const hrStr = String(hours || 0).padStart(2, '0');
    onChange(`${hrStr}:${String(m).padStart(2, '0')}`);
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
        className={`w-full h-[40px] px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-slate-900 border ${
          error
            ? 'border-rose-500'
            : 'border-slate-200 dark:border-slate-800'
        } rounded-xl shadow-xs transition cursor-pointer select-none`}
      >
        <span className="text-[11px] font-bold text-gray-950 dark:text-slate-100 font-mono">
          {value || '12:00'}
        </span>
        <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2.5 flex gap-4 w-44">
          {/* Hours Column */}
          <div className="flex-1 flex flex-col items-stretch max-h-44 overflow-y-auto pr-1">
            <span className="text-[8px] font-black text-center text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Hour</span>
            {Array.from({ length: 24 }).map((_, h) => {
              const selected = h === hours;
              return (
                <button
                  key={`hr-${h}`}
                  onClick={() => setHourValue(h)}
                  className={`py-1 text-[10px] font-mono font-bold rounded-md text-center shrink-0 ${
                    selected ? 'bg-teal-650 text-white dark:bg-teal-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {String(h).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          {/* Minutes Column */}
          <div className="flex-1 flex flex-col items-stretch max-h-44 overflow-y-auto">
            <span className="text-[8px] font-black text-center text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Min</span>
            {Array.from({ length: 12 }).map((_, m) => {
              const minVal = m * 5;
              const selected = minVal === minutes;
              return (
                <button
                  key={`min-${minVal}`}
                  onClick={() => setMinuteValue(minVal)}
                  className={`py-1 text-[10px] font-mono font-bold rounded-md text-center shrink-0 ${
                    selected ? 'bg-teal-650 text-white dark:bg-teal-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {String(minVal).padStart(2, '0')}
                </button>
              );
            })}
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
