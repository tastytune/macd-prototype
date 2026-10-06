import { useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { DateInput } from './DateInput';

export const TIME_SLOTS = [
  { id: 'morning-1',   period: 'MORNING',   label: '8:00 AM – 10:00 AM' },
  { id: 'morning-2',   period: 'MORNING',   label: '10:00 AM – 12:00 PM' },
  { id: 'afternoon-1', period: 'AFTERNOON', label: '1:00 PM – 3:00 PM' },
  { id: 'afternoon-2', period: 'AFTERNOON', label: '3:00 PM – 5:00 PM' },
];

export function getNextWeekdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export function slotLabel(slotId: string | null) {
  return slotId ? (TIME_SLOTS.find(s => s.id === slotId)?.label ?? '') : '';
}

type Tone = 'blue' | 'orange';

const TONES: Record<Tone, {
  panel: string; iconBg: string; icon: string; title: string; info: string;
  inputCard: string; inputDate: string; cardSel: string; cardDateSel: string;
  slotSel: string; slotIdle: string;
}> = {
  blue: {
    panel: 'border-blue-200 bg-blue-50/40',
    iconBg: 'bg-blue-100', icon: 'text-blue-600', title: 'text-blue-800', info: 'text-blue-400 hover:text-blue-600',
    inputCard: 'border-blue-200', inputDate: 'text-blue-700',
    cardSel: 'border-blue-300 bg-blue-50', cardDateSel: 'text-blue-700',
    slotSel: 'bg-blue-600 text-white',
    slotIdle: 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700',
  },
  orange: {
    panel: 'border-orange-200 bg-orange-50/40',
    iconBg: 'bg-orange-100', icon: 'text-orange-600', title: 'text-orange-800', info: 'text-orange-400 hover:text-orange-600',
    inputCard: 'border-orange-200', inputDate: 'text-orange-700',
    cardSel: 'border-orange-300 bg-orange-50', cardDateSel: 'text-orange-700',
    slotSel: 'bg-orange-500 text-white',
    slotIdle: 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700',
  },
};

interface AppointmentPanelProps {
  title: string;
  hint?: string;
  tone?: Tone;
  date: string;
  slotId: string | null;
  onChange: (date: string, slotId: string | null) => void;
  min?: string;
  className?: string;
}

/**
 * Shared appointment scheduler used by every MACD action:
 * title + info tooltip, date input, then the next available days with 2x2 time-slot grids.
 */
export function AppointmentPanel({ title, hint, tone = 'blue', date, slotId, onChange, min, className = '' }: AppointmentPanelProps) {
  const t = TONES[tone];
  const weekdays = getNextWeekdays(3);
  const [viaInput, setViaInput] = useState(false);

  return (
    <div className={`rounded-2xl border-2 p-5 ${t.panel} ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.iconBg}`}>
          <Calendar className={`w-4 h-4 ${t.icon}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-semibold ${t.title}`}>{title}</p>
          {hint && (
            <span className="relative group">
              <Info className={`w-3.5 h-3.5 cursor-pointer ${t.info}`} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs font-normal normal-case rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {hint}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </span>
            </span>
          )}
        </div>
      </div>

      <label className="text-xs text-gray-600 mb-1.5 block">Date</label>
      <DateInput
        value={date}
        min={min}
        onChange={v => { setViaInput(true); onChange(v, null); }}
      />

      {viaInput && date && (
        <div className={`mt-3 p-3 rounded-xl border bg-white ${t.inputCard}`}>
          <p className={`text-xs font-semibold mb-2 ${t.inputDate}`}>
            {formatDateLabel(new Date(date + 'T12:00:00'))}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map(slot => {
              const isSelected = slotId === slot.id;
              return (
                <button key={slot.id}
                  onClick={() => onChange(date, isSelected ? null : slot.id)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-medium text-center transition-colors ${isSelected ? t.slotSel : t.slotIdle}`}>
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {weekdays.map(day => {
          const dateStr = formatDateValue(day);
          const isCardSelected = !!slotId && date === dateStr;
          return (
            <div key={dateStr} className={`rounded-xl border p-3 transition-all ${isCardSelected ? t.cardSel : 'border-gray-200 bg-white'}`}>
              <p className={`text-xs font-semibold mb-2 ${isCardSelected ? t.cardDateSel : 'text-gray-600'}`}>{formatDateLabel(day)}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_SLOTS.map(slot => {
                  const isSelected = isCardSelected && slotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => { setViaInput(false); onChange(dateStr, isSelected ? null : slot.id); }}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium text-center transition-colors ${isSelected ? t.slotSel : t.slotIdle}`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
