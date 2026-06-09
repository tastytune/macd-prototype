import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Service, CartLine } from '../App';

interface ChangeTelevisionPlanProps {
  selectedSA?: Service | null;
  selectedInternetPlanId?: string;
  previousLines: CartLine[];
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, addOns: string[], lines: CartLine[]) => void;
}

const PLANS = [
  { id: '75plus',  channels: '75+',  price: 49.95  },
  { id: '150plus', channels: '150+', price: 79.95  },
  { id: '250plus', channels: '250+', price: 109.95 },
];

// Current TV plan per SA (sa-01047 has no TV service)
const SA_TV_PLAN: Record<string, string> = {
  'sa-00912': '150plus',
};

// Plans that can be selected per SA (non-selectable = disabled)
const SA_TV_SELECTABLE: Record<string, string[]> = {
  'sa-00912': ['75plus', '250plus'],          // 150+ is current → disabled
  'sa-01047': ['75plus'],                     // 200 Mbps tier only unlocks 75+
};

// Whether add-ons are available per SA
const SA_TV_ADDONS_ENABLED: Record<string, boolean> = {
  'sa-00912': true,
  'sa-01047': false,
};

const ADD_ONS = [
  { id: 'fanatic',  name: 'FANatic',      price: 5.99,  src: '/fanatic.png'  },
  { id: 'cinemax',  name: 'Cinemax',      price: 12.99, src: '/cinemax.png'  },
  { id: 'hbo',      name: 'HBO',          price: 14.99, src: '/hbo.png'      },
  { id: 'starz',    name: 'STARZ/Encore', price: 8.99,  src: '/starz.png'    },
  { id: 'showtime', name: 'Showtime',     price: 10.99, src: '/showtime.png' },
];

function ChannelTile({ name, src, selected, onToggle, disabled }: {
  name: string; src: string; selected: boolean; onToggle: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`rounded-xl overflow-hidden transition-all w-full
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : selected
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : 'opacity-80 hover:opacity-100'}`}
      style={{ aspectRatio: '1/1' }}
    >
      <img src={src} alt={name} className="w-full h-full object-cover" />
    </button>
  );
}

export function ChangeTelevisionPlan({ selectedSA, selectedInternetPlanId, previousLines, onBack, onSkip, onNext }: ChangeTelevisionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  const currentPlanId = SA_TV_PLAN[selectedSA?.id ?? ''] ?? null;
  const higherInternetSelected = selectedInternetPlanId === '1gig' || selectedInternetPlanId === '2gig';
  const selectablePlanIds = higherInternetSelected ? PLANS.map(p => p.id) : (SA_TV_SELECTABLE[selectedSA?.id ?? ''] ?? PLANS.map(p => p.id));
  const addOnsEnabled = higherInternetSelected ? true : (SA_TV_ADDONS_ENABLED[selectedSA?.id ?? ''] ?? true);

  const activePlan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : undefined;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';
  const planLabel = activePlan ? `${activePlan.channels} Channels` : '';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      {/* Account context */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Change Television Service</h1>
        <p className="text-gray-500 text-sm">
          Account: <span className="font-medium text-gray-700">Robert Johnson · ACC-004821</span>
          <span className="mx-2 text-gray-300">·</span>
          Service account: <span className="font-medium text-gray-700">{saName}</span>
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Left: plan selection + add-ons ── */}
        <div className="flex-1 min-w-0">

          {/* Skip TV */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onSkip}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
            >
              Skip TV
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-5">Select a new plan to change your current TV service</p>

          {/* Plan cards */}
          <div className="flex gap-4 mb-10">
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              const isSelectable = selectablePlanIds.includes(plan.id);
              const isSelected = selectedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => { if (isSelectable) setSelectedPlan(isSelected ? null : plan.id); }}
                  className={`flex-1 rounded-2xl border-2 p-6 text-center transition-all
                    ${!isSelectable
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
                    }`}
                >
                  {isCurrent && (
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-3">
                      Active
                    </span>
                  )}

                  <div className={`text-6xl font-bold leading-none mb-1
                    ${!isSelectable ? 'text-gray-300' : 'text-gray-900'}`}>
                    {plan.channels}
                  </div>
                  <div className={`text-base font-medium mb-4
                    ${!isSelectable ? 'text-gray-400' : 'text-gray-500'}`}>
                    Channels
                  </div>
                  <div className={`text-lg font-bold mb-1
                    ${!isSelectable ? 'text-gray-400' : 'text-gray-900'}`}>
                    ${plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400"> /month</span>
                  </div>

                  {!isSelectable ? (
                    <div className="mt-5">
                      {isCurrent && (
                        <p className="text-xs text-gray-400 mb-4">Select another plan to upgrade or change</p>
                      )}
                      <div className="w-full py-2 rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-default">
                        {isCurrent ? 'Your Current Plan' : 'Not Available'}
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-5 w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors
                      ${isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Channel add-ons */}
          <div className="mb-10">
            <h3 className={`text-base font-semibold mb-2 ${addOnsEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
              Choose optional services{planLabel ? ` for ${planLabel}` : ''}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Digital Music channels are included with your selected plan. Enhance your channel lineup with the following add-ons:
            </p>
            <div className="grid grid-cols-5 gap-4">
              {ADD_ONS.map(addOn => (
                <div key={addOn.id} className="flex flex-col items-center gap-2">
                  <div className="w-full">
                    <ChannelTile
                      name={addOn.name}
                      src={addOn.src}
                      selected={selectedAddOns.has(addOn.id)}
                      onToggle={() => toggleAddOn(addOn.id)}
                      disabled={!addOnsEnabled}
                    />
                  </div>
                  <span className={`text-xs font-medium text-center ${addOnsEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    {addOn.name}
                  </span>
                  <span className={`text-xs font-semibold ${addOnsEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    ${addOn.price.toFixed(2)}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onBack}
              className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                if (!selectedPlan || !activePlan) return;
                const tvLines: CartLine[] = [
                  { label: `TV ${activePlan.channels} channels`, price: activePlan.price, group: 'television' },
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.name, price: a.price, group: 'television' as const };
                  }),
                ];
                onNext(selectedPlan, [...selectedAddOns], [...previousLines, ...tvLines]);
              }}
              disabled={!selectedPlan}
              className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
                ${selectedPlan
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

              {(() => {
                const tvLines: CartLine[] = selectedPlan && activePlan ? [
                  { label: `TV ${activePlan.channels} channels`, price: activePlan.price, group: 'television' as const },
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.name, price: a.price, group: 'television' as const };
                  }),
                ] : [];
                const allLines = [...previousLines, ...tvLines];
                const total = allLines.reduce((s, l) => s + l.price, 0);
                return allLines.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {allLines.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{line.label}</span>
                        <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-gray-700">Total</span>
                      <span className="text-gray-900">${total.toFixed(2)}/mo</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3">Select a plan to see pricing</p>
                );
              })()}

              <p className="text-xs text-gray-400">Billed monthly</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
