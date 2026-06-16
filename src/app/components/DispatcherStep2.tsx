import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';

interface DispatcherStep2Props {
  action: MACDAction;
  onNext: (selectedServices: Service[], selectedChildItems: string[]) => void;
  onBack: () => void;
}

// Service Accounts (shared across all actions)
const serviceAccounts: Service[] = [
  {
    id: 'sa-00912',
    name: 'SA-00912 · Primary residence',
    status: 'Active',
    address: '412 Oak Ave, Lincoln, NE 68501',
  },
  {
    id: 'sa-01047',
    name: 'SA-01047 · Secondary property',
    status: 'Active',
    address: '88 Maple St, Omaha, NE 68102',
  },
];

const changeServiceAccounts = serviceAccounts;

const changeTags: Record<string, string[]> = {
  'sa-00912': ['Internet 2Gig', 'iTV Premium', 'Cinemax', 'FANatic'],
  'sa-01047': ['Internet 200M', 'Phone Bundle'],
};

const changePromoPills: Record<string, { label: string; style: string }[]> = {
  'sa-00912': [
    { label: 'Price Lock', style: 'bg-indigo-100 text-indigo-700' },
    { label: 'Promo', style: 'bg-purple-100 text-purple-700' },
  ],
  'sa-01047': [
    { label: 'Price Lock', style: 'bg-indigo-100 text-indigo-700' },
  ],
};

// Billing Accounts (for Deactivate / Reactivate)
interface BillingAccount {
  id: string;
  label: string;
  linkedSA: string;
  detail: string;
  amount: string;
  status: 'Current' | 'Past due';
  deactivated: boolean;
}

const billingAccounts: BillingAccount[] = [
  {
    id: 'ba-00391',
    label: 'BA-00391',
    linkedSA: 'SA-00912 · Primary residence',
    detail: 'Primary billing · Monthly',
    amount: '$189.00/mo',
    status: 'Current',
    deactivated: true,
  },
  {
    id: 'ba-00412',
    label: 'BA-00412',
    linkedSA: 'SA-00912 · Primary residence',
    detail: 'Equipment lease · Monthly',
    amount: '$14.99/mo',
    status: 'Current',
    deactivated: true,
  },
  {
    id: 'ba-00558',
    label: 'BA-00558',
    linkedSA: 'SA-01047 · Secondary property',
    detail: 'Primary billing · Monthly',
    amount: '$79.00/mo',
    status: 'Current',
    deactivated: false,
  },
];

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
  move: 'bg-[#f3e8f3] text-[#800080]',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  disconnect: 'Disconnect',
  change: 'Change',
  move: 'Move',
};

import { useState } from 'react';

export function DispatcherStep2({ action, onNext, onBack }: DispatcherStep2Props) {
  const isServiceAccountAction = action === 'disconnect' || action === 'move' || action === 'change';
  const activeServiceAccounts = action === 'change' ? changeServiceAccounts : serviceAccounts;

  // SA radio selection (Disconnect / Move)
  const [selectedSA, setSelectedSA] = useState<string>(serviceAccounts[0].id);

  // BA radio selection (Deactivate/Reactivate) — single select
  const [selectedBA, setSelectedBA] = useState<string>(billingAccounts[0].id);

  const handleNext = () => {
    if (isServiceAccountAction) {
      const sa = serviceAccounts.find(s => s.id === selectedSA);
      if (sa) onNext([sa], []);
    } else {
      const dummyService: Service = { id: 'billing', name: 'Billing accounts', status: 'Active' };
      onNext([dummyService], [selectedBA]);
    }
  };

  const canProceed = isServiceAccountAction ? !!selectedSA : !!selectedBA;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Select accounts</h1>
        <p className="text-gray-600">Robert Johnson</p>
      </div>

      {/* Content */}
      {isServiceAccountAction ? (
        /* ── Disconnect / Move: Service Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Service accounts</p>
          <div className="flex flex-col gap-3">
            {activeServiceAccounts.map(sa => {
              const isSelected = selectedSA === sa.id;
              const isMove = action === 'move';
              const selectedBorder = isMove ? 'border-[#800080]' : 'border-blue-600';
              const selectedBg = isMove ? 'bg-[#faf0fa]' : 'bg-blue-50';
              const radioBorder = isMove ? 'border-[#800080]' : 'border-blue-600';
              const radioDot = isMove ? 'bg-[#800080]' : 'bg-blue-600';
              return (
                <button
                  key={sa.id}
                  onClick={() => setSelectedSA(sa.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected ? `${selectedBorder} ${selectedBg}` : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  {/* Radio */}
                  <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2
                    ${isSelected ? radioBorder : 'border-gray-300'}`}
                    style={{ width: 18, height: 18 }}>
                    {isSelected && <div className={`w-2 h-2 rounded-full ${radioDot}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{sa.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3 inline-block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418-4.418-7-8.015-7-11A7 7 0 0 1 12 3a7 7 0 0 1 7 7c0 2.985-2.582 6.582-7 11z"/><circle cx="12" cy="10" r="2"/></svg>
                      {sa.address}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(changeTags[sa.id] ?? []).map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{tag}</span>
                      ))}
                      {(changePromoPills[sa.id] ?? []).map(pill => (
                        <span key={pill.label} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${pill.style}`}>{pill.label}</span>
                      ))}
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
              const isReactivate = action === 'reactivate';
              const isDisabled = isReactivate && !ba.deactivated;
              return (
                <button
                  key={ba.id}
                  onClick={() => !isDisabled && setSelectedBA(ba.id)}
                  disabled={isDisabled}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  {/* Radio */}
                  <div
                    className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2
                      ${isDisabled ? 'border-gray-300 bg-white' : isSelected ? 'border-blue-600' : 'border-gray-300 bg-white'}`}
                    style={{ width: 17, height: 17 }}
                  >
                    {isSelected && !isDisabled && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ba.label}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{ba.linkedSA}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ba.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{isReactivate && ba.deactivated ? '$10.00/mo' : ba.amount}</span>
                    {isReactivate ? (
                      ba.deactivated ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Deactivated
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">
                          Active
                        </span>
                      )
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
