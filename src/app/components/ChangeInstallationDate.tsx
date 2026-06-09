import { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import type { Service, CartLine } from '../App';
import { DateInput } from './DateInput';

interface ChangeInstallationDateProps {
  selectedSA?: Service | null;
  cartLines: CartLine[];
  onBack: () => void;
  onSkip: () => void;
  onNext: (date: string, slot: string) => void;
}

const TIME_SLOTS = [
  { id: 'morning-1', period: 'MORNING',    label: '8:00 AM – 10:00 AM' },
  { id: 'morning-2', period: 'MORNING',    label: '10:00 AM – 12:00 PM' },
  { id: 'afternoon-1', period: 'AFTERNOON', label: '1:00 PM – 3:00 PM' },
  { id: 'afternoon-2', period: 'AFTERNOON', label: '3:00 PM – 5:00 PM' },
];

function getNextWeekdays(count: number): Date[] {
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

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export function ChangeInstallationDate({ selectedSA, cartLines, onBack, onSkip, onNext }: ChangeInstallationDateProps) {
  const weekdays = getNextWeekdays(4);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ dateStr: string; slotId: string } | null>(null);

  const handleSlotClick = (date: Date, slotId: string) => {
    const dateStr = formatDateValue(date);
    setSelectedDate(dateStr);
    setSelectedSlot({ dateStr, slotId });
  };

  const handleDateInput = (value: string) => {
    setSelectedDate(value);
    setSelectedSlot(null);
  };

  const canContinue = selectedDate && selectedSlot;

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      {/* Account context */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Change Service</h1>
        <p className="text-gray-500 text-sm">
          Account: <span className="font-medium text-gray-700">Robert Johnson · ACC-004821</span>
          <span className="mx-2 text-gray-300">·</span>
          Service account: <span className="font-medium text-gray-700">{saName}</span>
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Left: date picker ── */}
        <div className="flex-1 min-w-0">

          {/* Skip appointment */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onSkip}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
            >
              Skip Appointment
            </button>
          </div>

          {/* Section header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Installation Date</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6 ml-12">
            Choose your preferred installation date for service activation.
          </p>

          {/* Manual date input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Preferred Installation Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-20" />
              <DateInput value={selectedDate} onChange={handleDateInput} className="pl-6" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Available dates: Weekdays only, up to 30 days in advance
            </p>
          </div>

          {/* Quick selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Selection – Next Available Dates:</p>
            <div className="grid grid-cols-2 gap-3">
              {weekdays.map(date => {
                const dateStr = formatDateValue(date);
                const isCardSelected = selectedSlot?.dateStr === dateStr;
                return (
                  <div
                    key={dateStr}
                    className={`rounded-xl border p-4 transition-all
                      ${isCardSelected ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200 bg-white'}`}
                  >
                    <p className={`text-xs font-semibold mb-3 ${isCardSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                      {formatDateLabel(date)}
                    </p>

                    {/* Morning */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Morning</p>
                    <div className="space-y-1.5 mb-3">
                      {TIME_SLOTS.filter(s => s.period === 'MORNING').map(slot => {
                        const isSelected = isCardSelected && selectedSlot?.slotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotClick(date, slot.id)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium text-left transition-colors
                              ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                              }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Afternoon */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Afternoon</p>
                    <div className="space-y-1.5">
                      {TIME_SLOTS.filter(s => s.period === 'AFTERNOON').map(slot => {
                        const isSelected = isCardSelected && selectedSlot?.slotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotClick(date, slot.id)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium text-left transition-colors
                              ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                              }`}
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

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onBack}
              className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => canContinue && onNext(selectedDate, selectedSlot!.slotId)}
              disabled={!canContinue}
              className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
                ${canContinue
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Continue
            </button>
          </div>
        </div>

        {/* ── Right: Order summary ── */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Order Summary</h3>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Service Address</p>
              <div className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-snug">{saAddress}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Monthly Recurring Charges
              </p>
              {cartLines.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {cartLines.map((line, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{line.label}</span>
                      <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-gray-700">Total</span>
                    <span className="text-gray-900">${cartLines.reduce((s, l) => s + l.price, 0).toFixed(2)}/mo</span>
                  </div>
                </div>
              ) : null}
              <p className="text-xs text-gray-400">Billed monthly</p>
            </div>

            {selectedSlot && (
              <>
                <div className="border-t border-gray-100 my-4" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Installation Appointment
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {formatDateLabel(new Date(selectedDate + 'T12:00:00'))}
                  </p>
                  <p className="text-sm text-gray-500">
                    {TIME_SLOTS.find(s => s.id === selectedSlot.slotId)?.label}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
