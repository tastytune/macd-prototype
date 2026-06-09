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

// Week starts Monday: Mo Tu We Th Fr | Sa Su (last two are weekend)
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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
  // Convert Sun-based getDay() to Mon-based column (Mon=0 … Sun=6)
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const firstCol = (firstDow + 6) % 7;

  const cells: (number | null)[] = Array(firstCol).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDayClick(day: number, col: number, iso: string) {
    if (col >= 5) return;                  // Sat or Sun
    if (min && iso < min) return;          // before min
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

          {/* Day-of-week headers — Sa/Su visually grayed */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h, i) => (
              <div
                key={h}
                className={`text-center text-xs font-medium py-1 select-none
                  ${i >= 5 ? 'text-gray-300' : 'text-gray-500'}`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const col = idx % 7; // 0=Mo … 4=Fr, 5=Sa, 6=Su
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const iso = `${viewYear}-${mm}-${dd}`;
              const isWeekend = col >= 5;
              const isPast = !!min && iso < min;
              const isDisabled = isWeekend || isPast;
              const isSelected = iso === value;
              const isToday = iso === todayISO;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day, col, iso)}
                  className={`
                    text-center text-xs py-1.5 rounded select-none
                    ${isSelected
                      ? 'bg-blue-600 text-white font-semibold cursor-pointer'
                      : isDisabled
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
