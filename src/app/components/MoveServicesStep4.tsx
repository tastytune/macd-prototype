import { useState } from 'react';
import { HelpCircle, Lock, Calendar } from 'lucide-react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { DateInput } from './DateInput';
import { Breadcrumb } from './Breadcrumb';

interface MoveServicesStep4Props {
  scenario: string;
  selectedSA?: Service | null;
  selectedServiceIds?: string[];
  onBack: () => void;
  onNext: (billingEnd: string, installation: string, timeSlot: string) => void;
}

// Original services active before the move (to compute originalMRC)
const SA_BASE_SERVICES: Record<string, { id: string; summaryLabel: string; price: number }[]> = {
  'sa-00912': [
    { id: 'internet', summaryLabel: 'Internet 2Gbps', price: 124.95 },
    { id: 'itv',      summaryLabel: 'iTV Preferred',  price: 79.95  },
    { id: 'cinemax',  summaryLabel: 'Cinemax',       price: 12.99  },
    { id: 'fanatic',  summaryLabel: 'FANatic',        price: 5.99   },
  ],
  'sa-01047': [
    { id: 'internet-200m', summaryLabel: 'Internet 200M', price: 69.95 },
    { id: 'phone-bundle',  summaryLabel: 'Phone Bundle',  price: 29.95 },
  ],
};

// Full catalog to resolve any selected service ID
const SERVICE_CATALOG: { id: string; summaryLabel: string; price: number }[] = [
  { id: 'internet',          summaryLabel: 'Internet 2Gbps',           price: 124.95 },
  { id: 'itv',               summaryLabel: 'iTV Preferred',           price: 79.95  },
  { id: 'cinemax',           summaryLabel: 'Cinemax',                 price: 12.99  },
  { id: 'fanatic',           summaryLabel: 'FANatic',                 price: 5.99   },
  { id: 'internet-coax-200', summaryLabel: 'Internet 200 Mbps',       price: 79.95  },
  { id: 'internet-coax-1g',  summaryLabel: 'Internet 1 Gbps',         price: 99.95  },
  { id: 'internet-200m',     summaryLabel: 'Internet 200M',           price: 69.95  },
  { id: 'phone-bundle',      summaryLabel: 'Phone Bundle',            price: 29.95  },
  { id: 'm04-1gig',          summaryLabel: 'Internet 1 Gbps (Offer)',  price: 49.95  },
  { id: 'm04-2gig',          summaryLabel: 'Internet 2 Gbps (Offer)',  price: 109.95 },
  { id: 'itv-75',            summaryLabel: 'iTV Essentials',          price: 49.95  },
  { id: 'itv-150',           summaryLabel: 'iTV Preferred',           price: 79.95  },
  { id: 'itv-250',           summaryLabel: 'iTV Extra',               price: 109.95 },
  { id: 'tv-hbo',            summaryLabel: 'HBO',                     price: 14.99  },
  { id: 'tv-cinemax',        summaryLabel: 'Cinemax',                 price: 12.99  },
  { id: 'tv-fanatic',        summaryLabel: 'FANatic',                 price: 5.99   },
  { id: 'tv-showtime',       summaryLabel: 'Showtime',                price: 10.99  },
  { id: 'tv-starz',          summaryLabel: 'STARZ',                   price: 8.99   },
];

const TIME_SLOTS = [
  { id: 'morning-1',   period: 'MORNING',    label: '8:00 AM – 10:00 AM' },
  { id: 'morning-2',   period: 'MORNING',    label: '10:00 AM – 12:00 PM' },
  { id: 'afternoon-1', period: 'AFTERNOON',  label: '1:00 PM – 3:00 PM' },
  { id: 'afternoon-2', period: 'AFTERNOON',  label: '3:00 PM – 5:00 PM' },
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

export function MoveServicesStep4({ scenario, selectedSA, selectedServiceIds, onBack, onNext }: MoveServicesStep4Props) {
  const baseServices = SA_BASE_SERVICES[selectedSA?.id ?? ''] ?? SA_BASE_SERVICES['sa-00912'];
  const originalMRC = baseServices.reduce((s, svc) => s + svc.price, 0);

  const movingServices = selectedServiceIds && selectedServiceIds.length > 0
    ? selectedServiceIds
        .map(id => SERVICE_CATALOG.find(s => s.id === id))
        .filter((s): s is { id: string; summaryLabel: string; price: number } => s !== undefined)
    : baseServices;
  const totalMRC = movingServices.reduce((s, svc) => s + svc.price, 0);
  const mrcDiff = totalMRC - originalMRC;
  const [billingEndDate, setBillingEndDate] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ dateStr: string; slotId: string } | null>(null);
  const [dateViaInput, setDateViaInput] = useState(false);

  const weekdays = getNextWeekdays(3);

  const installHint = scenario === 'M03'
    ? 'Min: 15 business days (technology change).'
    : 'Min: 10 business days (buried drop).';

  const canProceed = billingEndDate !== '';

  const handleSlotClick = (date: Date, slotId: string) => {
    const dateStr = formatDateValue(date);
    setInstallationDate(dateStr);
    setSelectedSlot({ dateStr, slotId });
    setDateViaInput(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
        <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={3} />

      <div className="flex gap-6 items-start">

        {/* Left: form card */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Dates &amp; schedule</h2>

            {/* Date fields */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="flex items-center gap-1.5 text-sm text-gray-700 mb-2">
                  Billing end date (old address) <span className="text-red-500">*</span>
                  <div className="relative group">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Date customer vacates. Billing stops here.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </label>
                <DateInput
                  value={billingEndDate}
                  onChange={v => setBillingEndDate(v)}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm text-gray-700 mb-2">
                  Installation date (new address)
                  <div className="relative group">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {installHint}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </label>
                <DateInput
                  value={installationDate}
                  onChange={v => { setInstallationDate(v); setSelectedSlot(null); setDateViaInput(true); }}
                />
                {dateViaInput && installationDate && (
                  <div className="mt-3 p-4 rounded-xl border border-gray-200 bg-white w-full">
                    {(['MORNING', 'AFTERNOON'] as const).map(period => (
                      <div key={period} className="mb-3 last:mb-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          {period === 'MORNING' ? 'Morning' : 'Afternoon'}
                        </p>
                        <div className="space-y-1.5">
                          {TIME_SLOTS.filter(s => s.period === period).map(slot => {
                            const isSelected = selectedSlot?.slotId === slot.id;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot({ dateStr: installationDate, slotId: slot.id })}
                                className={`block w-full py-1.5 px-3 rounded-lg text-xs font-medium text-left transition-colors
                                  ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Selection */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Quick Selection – Next Available Dates:</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {weekdays.map(date => {
                  const dateStr = formatDateValue(date);
                  const isCardSelected = selectedSlot?.dateStr === dateStr;
                  return (
                    <div
                      key={dateStr}
                      className={`w-52 rounded-2xl border p-5 transition-all
                        ${isCardSelected ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200 bg-white'}`}
                    >
                      <p className={`text-sm font-semibold mb-4 ${isCardSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        {formatDateLabel(date)}
                      </p>

                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Morning</p>
                      <div className="space-y-2 mb-4">
                        {TIME_SLOTS.filter(s => s.period === 'MORNING').map(slot => {
                          const isSelected = isCardSelected && selectedSlot?.slotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotClick(date, slot.id)}
                              className={`block w-full py-2 px-3 rounded-lg text-xs font-medium text-center transition-colors
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

                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Afternoon</p>
                      <div className="space-y-2">
                        {TIME_SLOTS.filter(s => s.period === 'AFTERNOON').map(slot => {
                          const isSelected = isCardSelected && selectedSlot?.slotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotClick(date, slot.id)}
                              className={`block w-full py-2 px-3 rounded-lg text-xs font-medium text-center transition-colors
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

            {/* Navigation */}
            <div className="flex justify-end gap-3 mt-10">
              <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  const slotLabel = selectedSlot ? (TIME_SLOTS.find(s => s.id === selectedSlot.slotId)?.label ?? '') : '';
                  onNext(billingEndDate, installationDate, slotLabel);
                }}
                disabled={!canProceed}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
                  ${canProceed
                    ? 'bg-[#800080] text-white hover:bg-[#6a006a]'
                    : 'bg-[#c9a0c9] text-white cursor-not-allowed'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>

              <div className="pb-4 mb-4 border-b border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Current monthly charges</span>
                  <span className="text-gray-900">${originalMRC.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {movingServices.map(svc => (
                  <div key={svc.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">{svc.summaryLabel}</span>
                    <span className="text-gray-700">${svc.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-500">Standard move fee</span>
                  <span className="text-gray-700">$65.00</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">New MRC</span>
                  <span className="text-xl font-medium text-gray-900">${totalMRC.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difference</span>
                  <span className={`font-semibold ${
                    mrcDiff < 0 ? 'text-red-600'
                    : mrcDiff > 0 ? 'text-green-600'
                    : 'text-gray-500'
                  }`}>
                    {mrcDiff === 0 ? '$0.00'
                      : mrcDiff > 0 ? `+$${mrcDiff.toFixed(2)}`
                      : `-$${Math.abs(mrcDiff).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <Lock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-blue-600 leading-snug">Price lock continues — clock does not reset.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
