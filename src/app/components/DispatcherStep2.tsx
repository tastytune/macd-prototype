import { useState } from 'react';
import type React from 'react';
import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';
import { ContextBar } from './ContextBar';
import { SA_00912, SA_01047, SA_02031, SA_03055, isServiceAccountBlocked, blockedReason, type GatedService } from '../serviceAccounts';

interface DispatcherStep2Props {
  action: MACDAction;
  initialSelectedBA?: string;
  onNext: (selectedServices: Service[], selectedChildItems: string[]) => void;
  onBack: () => void;
}

// Service Accounts (shared across all actions) — mock data lives in ../serviceAccounts.
// SA-03055 has an order in progress, so it's gated by isServiceAccountBlocked() (RFBP1-3571 AC10–13).
const serviceAccounts: GatedService[] = [SA_00912, SA_01047, SA_03055];
const changeServiceAccounts: GatedService[] = [SA_00912, SA_01047, SA_02031, SA_03055];
// Add On New Location: out of scope for gating (depends on the Billing Account, AC14–16) — unchanged list.
const addLocationServiceAccounts: GatedService[] = [SA_00912, SA_01047, SA_02031];

const changeTags: Record<string, string[]> = {
  'sa-00912': ['Internet 200Mbps', 'iTV Preferred', 'Cinemax', 'FANatic'],
  'sa-01047': ['Internet 200M', 'Phone Bundle'],
  'sa-02031': ['Phone Standalone'],
  'sa-03055': ['Internet 500M', 'iTV Basic'],
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
  'ba-00720': ['Internet 500M', 'iTV Basic'],
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
  linkedSAId: string;
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
    linkedSAId: 'sa-00912',
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
    linkedSAId: 'sa-00912',
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
    linkedSAId: 'sa-01047',
    linkedSA: 'SA-01047 · Secondary',
    detail: 'Primary billing · Monthly',
    amount: '$79.00/mo',
    status: 'Current',
    deactivateDisabled: false,
    reactivateDisabled: false, // deactivated → selectable
  },
  {
    id: 'ba-00720',
    label: 'BA-00720',
    linkedSAId: 'sa-03055',
    linkedSA: 'SA-03055 · Quaternary',
    detail: 'Primary billing · Monthly',
    amount: '$74.00/mo',
    status: 'Current',
    deactivateDisabled: false,
    reactivateDisabled: false,
  },
];

// Temporary Disconnect / Reconnect still act on the Billing Account today. We apply the same
// Service Account gating here anyway (a BA is blocked when its linked SA has an order in progress).
// TODO(story pending): move Temporary Disconnect / Reconnect to Service Accounts, then drop this lookup.
const allServiceAccounts: GatedService[] = [SA_00912, SA_01047, SA_02031, SA_03055];
const blockedSAForBA = (ba: BillingAccount): GatedService | undefined => {
  const sa = allServiceAccounts.find(x => x.id === ba.linkedSAId);
  return sa && isServiceAccountBlocked(sa) ? sa : undefined;
};

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
  move: 'bg-[#f3e8f3] text-[#800080]',
  move2: 'bg-blue-50 text-blue-700',
  followOnOrder: 'bg-indigo-50 text-indigo-700',
  addLocation: 'bg-teal-50 text-teal-700',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Temporary Disconnect',
  reactivate: 'Reconnect',
  disconnect: 'Disconnect',
  change: 'Change and Add New Service',
  move: 'Move',
  move2: 'Move 2',
  followOnOrder: 'Follow-On Order',
  addLocation: 'Add On New Location',
};

export function DispatcherStep2({ action, initialSelectedBA, onNext, onBack }: DispatcherStep2Props) {
  const isServiceAccountAction = action === 'disconnect' || action === 'move' || action === 'move2' || action === 'change' || action === 'addLocation';
  const isAddLocation = action === 'addLocation';
  const activeServiceAccounts = action === 'addLocation' ? addLocationServiceAccounts : action === 'change' ? changeServiceAccounts : serviceAccounts;
  const anySABlocked = !isAddLocation && activeServiceAccounts.some(isServiceAccountBlocked);
  const anyBABlocked = billingAccounts.some(ba => !!blockedSAForBA(ba));

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

  // Arrow-key navigation across enabled (non-blocked) accounts only
  const handleSAKeyDown = (e: React.KeyboardEvent, saId: string) => {
    if (isAddLocation || serviceabilityLoading) return;
    const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const enabled = activeServiceAccounts.filter(a => !isServiceAccountBlocked(a));
    const i = enabled.findIndex(a => a.id === saId);
    const next = enabled[(i + dir + enabled.length) % enabled.length];
    if (next && next.id !== saId) {
      handleSAClick(next.id);
      document.getElementById(`sa-row-${next.id}`)?.focus();
    }
  };

  const handleNext = () => {
    if (isAddLocation) {
      // Placeholder: no existing account is being selected — a new one will be created
      const newLocationService: Service = { id: 'new-location', name: 'New location', status: 'Active' };
      onNext([newLocationService], []);
    } else if (isServiceAccountAction) {
      const sa = activeServiceAccounts.find(s => s.id === selectedSA);
      if (sa) onNext([sa], []);
    } else {
      const dummyService: Service = { id: 'billing', name: 'Billing accounts', status: 'Active' };
      onNext([dummyService], [selectedBA]);
    }
  };

  const canProceed = isAddLocation ? true : isServiceAccountAction ? !!selectedSA : !!selectedBA;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">{isAddLocation ? 'Create Account' : 'Select accounts'}</h1>
        <ContextBar action={action} selectedSA={null} />
      </div>

      {/* Content */}
      {isServiceAccountAction ? (
        /* ── Disconnect / Move: Service Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {isAddLocation ? 'Existing service accounts (creating a new one instead)' : 'Service accounts'}
          </p>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Service accounts">
            {activeServiceAccounts.map(sa => {
              if (!isAddLocation && isServiceAccountBlocked(sa)) {
                const tipId = `sa-blocked-tip-${sa.id}`;
                return (
                  <div
                    key={sa.id}
                    id={`sa-row-${sa.id}`}
                    role="radio"
                    aria-checked={false}
                    aria-disabled="true"
                    tabIndex={0}
                    aria-describedby={tipId}
                    className="group flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white text-left cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0 opacity-[0.55]">
                      <div className="mt-0.5 flex-shrink-0 rounded-full border-2 border-gray-300 bg-gray-100" style={{ width: 18, height: 18 }} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{sa.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3 inline-block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418-4.418-7-8.015-7-11A7 7 0 0 1 12 3a7 7 0 0 1 7 7c0 2.985-2.582 6.582-7 11z"/><circle cx="12" cy="10" r="2"/></svg>
                          {sa.address}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(changeTags[sa.id] ?? []).map(tag => (
                            <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${changeTagStyle[tag] ?? defaultTagStyle}`}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Badge sits outside the dimmed wrapper so it keeps AA contrast */}
                    <span className="relative flex-shrink-0">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Order in progress
                      </span>
                      <span
                        id={tipId}
                        role="tooltip"
                        className="absolute right-0 top-full mt-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs font-normal rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-20"
                      >
                        {blockedReason(sa)}
                      </span>
                    </span>
                  </div>
                );
              }
              const isSelected = !isAddLocation && selectedSA === sa.id;
              const isLoading = serviceabilityLoading === sa.id;
              const isFiber = fiberEligible.has(sa.id);
              return (
                <button
                  key={sa.id}
                  id={`sa-row-${sa.id}`}
                  role="radio"
                  aria-checked={isSelected}
                  onKeyDown={e => handleSAKeyDown(e, sa.id)}
                  onClick={() => !isAddLocation && handleSAClick(sa.id)}
                  disabled={isAddLocation || !!serviceabilityLoading}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${isAddLocation
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : isLoading
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
          {anySABlocked && (
            <p className="mt-3 text-xs text-gray-500">Some service accounts are unavailable because of open orders.</p>
          )}
        </div>
      ) : (
        /* ── Deactivate / Reactivate: Billing Accounts ── */
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Billing accounts</p>
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Billing accounts">
            {billingAccounts.map(ba => {
              const isSelected = selectedBA === ba.id;
              const isReactivate = action === 'reactivate';
              const isDeactivate = action === 'deactivate';
              const blockedSA = blockedSAForBA(ba);
              if (blockedSA) {
                const tipId = `ba-blocked-tip-${ba.id}`;
                return (
                  <div
                    key={ba.id}
                    role="radio"
                    aria-checked={false}
                    aria-disabled="true"
                    tabIndex={0}
                    aria-describedby={tipId}
                    className="group flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white text-left cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0 opacity-[0.55]">
                      <div className="mt-0.5 flex-shrink-0 rounded-full border-2 border-gray-300 bg-gray-100" style={{ width: 17, height: 17 }} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{ba.label}</p>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">{ba.linkedSA}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ba.detail}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(baTags[ba.id] ?? []).map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-400 text-white font-medium">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{ba.amount}</span>
                    </div>
                    <span className="relative flex-shrink-0 self-start">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Order in progress
                      </span>
                      <span
                        id={tipId}
                        role="tooltip"
                        className="absolute right-0 top-full mt-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs font-normal rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-20"
                      >
                        {blockedReason(blockedSA)}
                      </span>
                    </span>
                  </div>
                );
              }
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
          {anyBABlocked && (
            <p className="mt-3 text-xs text-gray-500">Some service accounts are unavailable because of open orders.</p>
          )}
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
          {isAddLocation ? 'Create New Service Account' : 'Next'}
        </button>
      </div>
    </div>
  );
}
