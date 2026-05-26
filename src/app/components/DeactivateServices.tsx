import { useState } from 'react';
import { Wifi, Phone, Tv, AlertTriangle, HelpCircle } from 'lucide-react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

interface DeactivateServicesProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  onBack: () => void;
  onDeactivate: (date: string) => void;
}

const activeServices = [
  { id: 'internet', name: 'Residential Internet', icon: Wifi },
  { id: 'phone',    name: 'Phone bundle',          icon: Phone },
  { id: 'tv',       name: 'iTV Extra',             icon: Tv },
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

export function DeactivateServices({ action, selectedSA, onBack, onDeactivate }: DeactivateServicesProps) {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const vacationDefaultDate = addBusinessDays(todayDate, 3);
  const [deactivationDate, setDeactivationDate] = useState(today);
  const [selected, setSelected] = useState<Set<string>>(new Set(activeServices.map(s => s.id)));
  const [reason, setReason] = useState('NPD');

  const handleReasonChange = (value: string) => {
    setReason(value);
    setDeactivationDate(value === 'Customer Initiated' ? vacationDefaultDate : today);
  };
  const [vacationReturnDate, setVacationReturnDate] = useState('');
  const [comments, setComments] = useState('');

  const deactivationReasons = ['NPD', 'Customer Initiated', 'Deactivation'];

  const allSelected = selected.size === activeServices.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(activeServices.map(s => s.id)));
  };


  const canDeactivate = selected.size > 0 && reason !== '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Deactivate Services</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>

      {/* Deactivation Date — hidden when Vacation is selected */}
      {reason !== 'Customer Initiated' && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-gray-600 flex items-center gap-1.5">
            Requested Deactivation Date<span className="text-red-600 ml-1">*</span>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Deactivation date takes X amount of days
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </span>
          <div className="relative inline-block">
            <input
              type="date"
              value={deactivationDate}
              onChange={e => setDeactivationDate(e.target.value)}
              min={today}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <span className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
              {formatDate(deactivationDate)}
            </span>
          </div>
        </div>
      )}

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

        {activeServices.map(svc => {
          const Icon = svc.icon;

          return (
            <div key={svc.id} className="border-b border-gray-200 last:border-0">
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 flex-1">{svc.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                  Active
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
              Deactivation Reason<span className="text-red-600 ml-1">*</span>
            </label>
            <select
              value={reason}
              onChange={e => handleReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {deactivationReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Customer Initiated' && (
            <>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  Requested Deactivate Date<span className="text-red-600 ml-1">*</span>
                  <div className="relative group">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Deactivation date takes X amount of days
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </label>
                <input
                  type="date"
                  value={deactivationDate}
                  onChange={e => setDeactivationDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requested Reactivate Date<span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={vacationReturnDate}
                  onChange={e => setVacationReturnDate(e.target.value)}
                  min={deactivationDate || today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
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

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          The user is about to deactivate products and its related features.
        </p>
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
          onClick={() => onDeactivate(deactivationDate)}
          disabled={!canDeactivate}
          className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
            canDeactivate
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Deactivate
        </button>
      </div>
    </div>
  );
}
