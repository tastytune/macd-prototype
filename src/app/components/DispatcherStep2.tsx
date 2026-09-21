import { useState } from 'react';
import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';
import { ContextBar } from './ContextBar';

interface DispatcherStep2Props {
  action: MACDAction;
  initialSelectedBA?: string;
  onNext: (selectedServices: Service[], selectedChildItems: string[]) => void;
  onBack: () => void;
}

// Service Accounts (shared across all actions)
const serviceAccounts: Service[] = [
  {
    id: 'sa-00912',
    name: 'SA-00912 · Primary',
    status: 'Active',
    address: '412 Oak Ave, Lincoln, NE 68501',
  },
  {
    id: 'sa-01047',
    name: 'SA-01047 · Secondary',
    status: 'Active',
    address: '88 Maple St, Omaha, NE 68102',
  },
];

const changeServiceAccounts: Service[] = [
  ...serviceAccounts,
  {
    id: 'sa-02031',
    name: 'SA-02031 · Tertiary',
    status: 'Active',
    address: '214 Birch Rd, Lincoln, NE 68502',
  },
];

const changeTags: Record<string, string[]> = {
  'sa-00912': ['Internet 200Mbps', 'iTV Preferred', 'Cinemax', 'FANatic'],
  'sa-01047': ['Internet 200M', 'Phone Bundle'],
  'sa-02031': ['Phone Standalone'],
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

const changeTagStyle: Record<string, string> = {
  'Phone Standalone': 'bg-teal-500 text-white',
};
const defaultTagStyle = 'bg-blue-400 text-white';

const baTags: Record<string, string[]> = {
  'ba-00391': ['Internet 2Gbps', 'iTV Preferred', 'Cinemax', 'FANatic'],
  'ba-00412': ['Equipment Lease'],
  'ba-00558': ['Internet 200M', 'Phone Bundle'],
};

const baPromoPills: Record<string, { label: string; style: string }[]> = {
  'ba-00391': [
    { label: 'Price Lock', style: 'bg-indigo-100 text-indigo-700' },
    { label: 'Promo',      style: 'bg-purple-100 text-purple-700' },
  ],
  'ba-00558': [
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
  deactivateDisabled: boolean; // already deactivated → can't deactivate again
  reactivateDisabled: boolean; // already active    → can't reactivate
}

const billingAccounts: BillingAccount[] = [
  {
    id: 'ba-00391',
    label: 'BA-00391',
    linkedSA: 'SA-00912 · Primary',
    detail: 'Primary billing · Monthly',
    amount: '$189.00/mo',
    status: 'Current',
    deactivateDisabled: false,
    reactivateDisabled: false,
  },
  {
    id: 'ba-00412',
    label: 'BA-00412',
    linkedSA: 'SA-00912 · Primary',
    detail: 'Equipment lease · Monthly',
    amount: '$14.99/mo',
    status: 'Current',
    deactivateDisabled: true,  // already deactivated
    reactivateDisabled: true,  // already active
  },
  {
    id: 'ba-00558',
    label: 'BA-00558',
    linkedSA: 'SA-01047 · Secondary',
    detail: 'Primary billing · Monthly',
    amount: '$79.00/mo',
    status: 'Current',
    deactivateDisabled: false,
    reactivateDisabled: false, // deactivated → selectable
  },
];

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
  move: 'bg-[#f3e8f3] text-[#800080]',
  move2: 'bg-blue-50 text-blue-700',
  followOnOrder: 'bg-indigo-50 text-indigo-700',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Temporary Disconnect',
  reactivate: 'Reconnect',
  disconnect: 'Disconnect',
  change: 'Change',
  move: 'Move',
  move2: 'Move 2',
  followOnOrder: 'Follow On Order',
};

export function DispatcherStep2({ action, initialSelectedBA, onNext, onBack }: DispatcherStep2Props) {
  const isServiceAccountAction = action === 'disconnect' || action === 'move' || action === 'move2' || action === 'change';
  const activeServiceAccounts = action === 'change' ? changeServiceAccounts : serviceAccounts;

  // SA radio selection (Disconnect / Move)
  const [selectedSA, setSelectedSA] = useState<string>(serviceAccounts[0].id);

  // BA radio selection (Deactivate/Reactivate) — single select
  const [selectedBA, setSelectedBA] = useState<string>(initialSelectedBA ?? billingAccounts[0].id);

  // Serviceability check simulation — runs for every SA; sa-02031 additionally
  // surfaces the "Fiber Eligible" result once the check completes.
  const [serviceabilityLoading, setServiceabilityLoading] = useState<string | null>(null);
  const [serviceabilityChecked, setServiceabilityChecked] = useState<Set<string>>(new Set());
  const [fiberEligible, setFiberEligible] = useState<Set<string>>(new Set());

  const handleSAClick = (saId: string) => {
    if (serviceabilityLoading) return;
    if (selectedSA === saId) return;
    if (!serviceabilityChecked.has(saId)) {
      setServiceabilityLoading(saId);
      setTimeout(() => {
        setServiceabilityLoading(null);
        setServiceabilityChecked(prev => new Set([...prev, saId]));
        if (saId === 'sa-02031') {
          setFiberEligible(prev => new Set([...prev, saId]));
        }
        setSelectedSA(saId);
      }, 1800);
    } else {
      setSelectedSA(saId);
    }
  };

  const handleNext = () => {
    if (isServiceAccountAction) {
      const sa = activeServiceAccounts.find(s => s.id === selectedSA);
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
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Select accounts</h1>
        <ContextBar action={action} selectedSA={null} />
      </div>

      {/* Content */}
      {isServiceAccountAction ? (
        /* ── Disconnect / Move: Service Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Service accounts</p>
          <div className="flex flex-col gap-3">
            {activeServiceAccounts.map(sa => {
              const isSelected = selectedSA === sa.id;
              const isLoading = serviceabilityLoading === sa.id;
              const isFiber = fiberEligible.has(sa.id);
              return (
                <button
                  key={sa.id}
                  onClick={() => handleSAClick(sa.id)}
                  disabled={!!serviceabilityLoading}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isLoading
                      ? 'border-blue-300 bg-blue-50/40 animate-pulse cursor-wait'
                      : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  {/* Radio / spinner */}
                  {isLoading ? (
                    <svg className="mt-0.5 w-4 h-4 flex-shrink-0 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2
                      ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}
                      style={{ width: 18, height: 18 }}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{sa.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3 inline-block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418-4.418-7-8.015-7-11A7 7 0 0 1 12 3a7 7 0 0 1 7 7c0 2.985-2.582 6.582-7 11z"/><circle cx="12" cy="10" r="2"/></svg>
                      {sa.address}
                    </p>
                    {isLoading && (
                      <p className="text-xs text-blue-500 mt-1 font-medium">Checking serviceability…</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(changeTags[sa.id] ?? []).map(tag => (
                        <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${changeTagStyle[tag] ?? defaultTagStyle}`}>{tag}</span>
                      ))}
                      {(changePromoPills[sa.id] ?? []).map(pill => (
                        <span key={pill.label} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${pill.style}`}>{pill.label}</span>
                      ))}
                      {isFiber && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                          Fiber Eligible
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium flex-shrink-0">
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
              const isDeactivate = action === 'deactivate';
              const isDisabled = (isReactivate && ba.reactivateDisabled) || (isDeactivate && ba.deactivateDisabled);
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
                    {((baTags[ba.id] ?? []).length > 0 || (baPromoPills[ba.id] ?? []).length > 0) && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {(baTags[ba.id] ?? []).map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-400 text-white font-medium">{tag}</span>
                        ))}
                        {(baPromoPills[ba.id] ?? []).map(pill => (
                          <span key={pill.label} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${pill.style}`}>{pill.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {(isDeactivate && ba.deactivateDisabled) || (isReactivate && !ba.reactivateDisabled) ? '$10.00/mo' : ba.amount}
                    </span>
                    {isDeactivate ? (
                      ba.deactivateDisabled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Temporarily Disconnected
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${ba.status === 'Current' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {ba.status}
                        </span>
                      )
                    ) : isReactivate ? (
                      ba.reactivateDisabled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Temporarily Disconnected
                        </span>
                      )
                    ) : null}
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
