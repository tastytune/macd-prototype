import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';

interface DispatcherStep2Props {
  action: MACDAction;
  onNext: (selectedServices: Service[], selectedChildItems: string[]) => void;
  onBack: () => void;
}

// Service Accounts (for Disconnect)
const serviceAccounts: Service[] = [
  {
    id: 'sa-00912',
    name: 'SA-00912 · Primary residence',
    status: 'Active',
    address: '412 Oak Ave, Lincoln, NE 68301',
  },
  {
    id: 'sa-01047',
    name: 'SA-01047 · Secondary property',
    status: 'Active',
    address: '88 Maple St, Omaha, NE 68102',
  },
];

// Billing Accounts (for Deactivate / Reactivate)
interface BillingAccount {
  id: string;
  label: string;
  linkedSA: string;
  detail: string;
  amount: string;
  status: 'Current' | 'Past due';
}

const billingAccounts: BillingAccount[] = [
  {
    id: 'ba-00391',
    label: 'BA-00391',
    linkedSA: 'SA-00912 · Primary residence',
    detail: 'Primary billing · Monthly',
    amount: '$189.00/mo',
    status: 'Current',
  },
  {
    id: 'ba-00412',
    label: 'BA-00412',
    linkedSA: 'SA-00912 · Primary residence',
    detail: 'Equipment lease · Monthly',
    amount: '$14.99/mo',
    status: 'Current',
  },
  {
    id: 'ba-00558',
    label: 'BA-00558',
    linkedSA: 'SA-01047 · Secondary property',
    detail: 'Primary billing · Monthly',
    amount: '$79.00/mo',
    status: 'Past due',
  },
];

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  disconnect: 'Disconnect',
  change: 'Change',
};

import { useState } from 'react';

export function DispatcherStep2({ action, onNext, onBack }: DispatcherStep2Props) {
  const isDisconnect = action === 'disconnect';

  // SA radio selection (Disconnect)
  const [selectedSA, setSelectedSA] = useState<string>(serviceAccounts[0].id);

  // BA radio selection (Deactivate/Reactivate) — single select
  const [selectedBA, setSelectedBA] = useState<string>(billingAccounts[0].id);

  const handleNext = () => {
    if (isDisconnect) {
      const sa = serviceAccounts.find(s => s.id === selectedSA);
      if (sa) onNext([sa], []);
    } else {
      const dummyService: Service = { id: 'billing', name: 'Billing accounts', status: 'Active' };
      onNext([dummyService], [selectedBA]);
    }
  };

  const canProceed = isDisconnect ? !!selectedSA : !!selectedBA;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">

      {/* Stepper */}
      <div className="flex items-start justify-center mb-12">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-7 h-7 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs text-blue-600 font-medium text-center whitespace-nowrap">Select action</span>
        </div>
        <div className="flex-1 h-px bg-blue-600 mt-3.5" />
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-7 h-7 rounded-full border-2 border-blue-600 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-900 text-center whitespace-nowrap">Select accounts</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Select accounts</h1>
        <p className="text-gray-600 flex items-center gap-2 flex-wrap">
          Action:
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionBadgeStyle[action]}`}>
            {actionLabel[action]}
          </span>
          <span className="text-gray-400">·</span>
          Robert Johnson
          
        </p>
      </div>

      {/* Content */}
      {isDisconnect ? (
        /* ── Disconnect: Service Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Service accounts</p>
          <div className="flex flex-col gap-3">
            {serviceAccounts.map(sa => {
              const isSelected = selectedSA === sa.id;
              return (
                <button
                  key={sa.id}
                  onClick={() => setSelectedSA(sa.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  {/* Radio */}
                  <div className={`mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}
                    style={{ width: 18, height: 18 }}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{sa.name}</p>
                    <p className="text-xs text-gray-500">{sa.address}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {sa.id === 'sa-00912' ? (
                        <>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Internet 2Gig</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">iTV Premium</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Internet 200M</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Phone Bundle</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex-shrink-0">
                    Active
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Deactivate / Reactivate: Billing Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Billing accounts</p>
          <div className="flex flex-col gap-3">
            {billingAccounts.map(ba => {
              const isSelected = selectedBA === ba.id;
              return (
                <button
                  key={ba.id}
                  onClick={() => setSelectedBA(ba.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  {/* Radio */}
                  <div
                    className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2
                      ${isSelected ? 'border-blue-600' : 'border-gray-300 bg-white'}`}
                    style={{ width: 17, height: 17 }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ba.label}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{ba.linkedSA}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ba.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{action === 'reactivate' ? '$10.00/mo' : ba.amount}</span>
                    {action === 'reactivate' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Deactivated
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${ba.status === 'Current' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {ba.status}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
            ${canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
