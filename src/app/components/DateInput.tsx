import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateInputProps {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  className?: string;
}

function formatUS(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

export function DateInput({ value, onChange, min, className = '' }: DateInputProps) {
  const todayISO = new Date().toISOString().split('T')[0];
  const seed = value || todayISO;
  const [viewYear, setViewYear] = useState(() => parseInt(seed.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => parseInt(seed.split('-')[1]) - 1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build a 5-column (Mon–Fri only) grid — weekends are excluded entirely
  const weekdayCells: (number | null)[] = [];
  let firstWeekday = 1;
  let firstWeekdayCol = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (new Date(viewYear, viewMonth, d).getDay() + 6) % 7; // Mon=0…Sun=6
    if (dow < 5) { firstWeekday = d; firstWeekdayCol = dow; break; }
  }
  for (let i = 0; i < firstWeekdayCol; i++) weekdayCells.push(null);
  for (let d = firstWeekday; d <= daysInMonth; d++) {
    const dow = (new Date(viewYear, viewMonth, d).getDay() + 6) % 7;
    if (dow < 5) weekdayCells.push(d);
  }
  while (weekdayCells.length % 5 !== 0) weekdayCells.push(null);

  function handleDayClick(iso: string) {
    if (min && iso < min) return;
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Display field */}
      <div
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white cursor-pointer hover:border-blue-400 select-none"
      >
        {value
          ? <span className="text-gray-700">{formatUS(value)}</span>
          : <span className="text-gray-400">MM/DD/YYYY</span>
        }
      </div>

      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day-of-week headers — Mon to Fri only */}
          <div className="grid grid-cols-5 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-xs font-medium py-1 select-none text-gray-500">
                {h}
              </div>
            ))}
          </div>

          {/* Day cells — 5-column weekday grid */}
          <div className="grid grid-cols-5">
            {weekdayCells.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const iso = `${viewYear}-${mm}-${dd}`;
              const isPast = !!min && iso < min;
              const isSelected = iso === value;
              const isToday = iso === todayISO;

              return (
                <div
                  key={idx}
                  onClick={() => !isPast && handleDayClick(iso)}
                  className={`
                    text-center text-xs py-1.5 rounded select-none
                    ${isSelected
                      ? 'bg-blue-600 text-white font-semibold cursor-pointer'
                      : isPast
                        ? 'text-gray-300 cursor-default'
                        : isToday
                          ? 'text-blue-600 font-semibold cursor-pointer hover:bg-blue-50'
                          : 'text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-blue-700'
                    }
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
