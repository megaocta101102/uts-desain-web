import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pilih Tanggal',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view year and month from value or today
  const getInitialYearMonth = () => {
    if (value && value.includes('-')) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { y, m: m - 1 };
    }
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  };

  const initial = getInitialYearMonth();
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const [yearInput, setYearInput] = useState(() => String(initial.y));

  // Sync year input when viewYear changes
  useEffect(() => {
    setYearInput(String(viewYear));
  }, [viewYear]);

  // When value changes from outside, sync view
  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m] = value.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYearInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
    }
  };

  const handleYearInputBlur = () => {
    const parsed = parseInt(yearInput, 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
      setViewYear(parsed);
      setYearInput(String(parsed));
    } else {
      setYearInput(String(viewYear));
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  // Formatter for display
  const formatDisplay = (val: string) => {
    if (!val) return '';
    const parts = val.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return val;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="clay-input !py-2 !px-3 text-xs w-full flex items-center justify-between cursor-pointer bg-white hover:border-blue-400 transition-colors shadow-xs"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className={value ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            title="Hapus tanggal"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Pilih</span>
        )}
      </div>

      {/* Popover Kalender */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Kalender Bernuansa Biru Elegan */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
              <span className="font-bold text-sm tracking-wide">
                {MONTH_NAMES[viewMonth]}
              </span>
              <input
                type="number"
                min="1900"
                max="2100"
                value={yearInput}
                onChange={handleYearInputChange}
                onBlur={handleYearInputBlur}
                className="w-16 bg-white/20 hover:bg-white/30 focus:bg-white text-white focus:text-blue-900 font-bold text-sm text-center rounded-lg px-1 py-0.5 border border-white/30 focus:border-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-text"
                title="Klik untuk mengedit tahun"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-xl hover:bg-white/20 transition-colors text-white active:scale-95"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Kalender Grid: Nama Hari */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 pt-3 pb-1.5 px-2.5 bg-white border-b border-slate-100">
            {DAY_NAMES.map((name, idx) => (
              <div
                key={name}
                className={idx === 0 ? 'text-red-500' : 'text-slate-600'}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Kalender Grid: Angka Tanggal */}
          <div className="grid grid-cols-7 gap-1 p-2.5 pt-0 text-center text-xs bg-white">
            {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}
            {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, i) => {
              const dayNumber = i + 1;
              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(dayNumber).padStart(2, '0');
              const dateStr = `${viewYear}-${mStr}-${dStr}`;
              const isSelected = dateStr === value;
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dayNumber}
                  type="button"
                  onClick={() => handleSelectDay(dayNumber)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                      : isToday
                      ? 'border-2 border-blue-600 text-blue-700 font-bold bg-blue-50'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
                  }`}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Kalender Popover */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 px-3.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              Biru = Dipilih
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
