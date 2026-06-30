import { useState } from 'react';
import { Wifi, Phone, Tv, HelpCircle } from 'lucide-react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { DateInput } from './DateInput';
import { Breadcrumb } from './Breadcrumb';

interface ReactivateServicesProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  onBack: () => void;
  onReactivate: (date: string) => void;
}

const deactivatedServices = [
  { id: 'internet', name: 'Residential Internet', icon: Wifi },
  { id: 'phone',    name: 'Phone bundle',          icon: Phone },
  { id: 'tv',       name: 'iTV Extra',             icon: Tv },
];

const reactivationReasons = [
  'Fully Paid — Account balance cleared in full',
  'Partial Pay — A portion of the balance has been paid',
  'Payment Arrangement — A payment plan has been agreed upon',
  'Customer-Initiated Vacation',
  'Operator Initiated',
];

function addBusinessDays(from: Date, days: number): string {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

export function ReactivateServices({ action, selectedSA, onBack, onReactivate }: ReactivateServicesProps) {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const [reactivationDate, setReactivationDate] = useState(() => addBusinessDays(todayDate, 2));
  const [selected, setSelected] = useState<Set<string>>(new Set(deactivatedServices.map(s => s.id)));
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');

  const allSelected = selected.size === deactivatedServices.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(deactivatedServices.map(s => s.id)));
  };

  const canReactivate = selected.size > 0 && reason !== '';

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Reactivate Services</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Services', 'Review order']} currentIndex={1} />

      {/* Service list */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        {/* Select All */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <button
            onClick={toggleAll}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              allSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
            }`}
          >
            {allSelected && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
          <span className="text-sm text-gray-700">Select All</span>
        </div>

        {deactivatedServices.map(svc => {
          const Icon = svc.icon;

          return (
            <div key={svc.id} className="border-b border-gray-200 last:border-0">
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 flex-1">{svc.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                  Deactivated
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reason + Comments */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reactivation Reason<span className="text-red-600 ml-1">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            >
              <option value="">Select a reason...</option>
              {reactivationReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              Requested Reactivation Date<span className="text-red-600 ml-1">*</span>
              <div className="relative group">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Reactivation takes X amount of days.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            </label>
            <DateInput value={reactivationDate} onChange={setReactivationDate} min={today} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Comments
          </label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={3}
            placeholder="Enter any additional comments..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={() => onReactivate(reactivationDate)}
          disabled={!canReactivate}
          className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
            canReactivate
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Reactivate
        </button>
      </div>
    </div>
  );
}
