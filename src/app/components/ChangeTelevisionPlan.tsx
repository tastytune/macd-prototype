import { useState } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import type { Service, CartLine } from '../App';
import { PromoSection, PROMOS } from './ChangePromos';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface ChangeTelevisionPlanProps {
  selectedSA?: Service | null;
  selectedInternetPlanId?: string;
  previousLines: CartLine[];
  isDowngrade?: boolean;
  isUpgrade?: boolean;
  isMove2?: boolean;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, addOns: string[], lines: CartLine[]) => void;
}

const PLANS = [
  { id: '75plus',  channels: '75+',  name: 'iTV Essentials', price: 49.95  },
  { id: '150plus', channels: '150+', name: 'iTV Preferred',  price: 79.95  },
  { id: '250plus', channels: '250+', name: 'iTV Extra',      price: 109.95 },
];

// Current TV plan per SA (sa-01047 has no TV service)
const SA_TV_PLAN: Record<string, string> = {
  'sa-00912': '150plus',
};

// Plans that can be selected per SA (non-selectable = disabled)
const SA_TV_SELECTABLE: Record<string, string[]> = {
  'sa-00912': ['75plus', '250plus'],          // 150+ is current → disabled
  'sa-01047': ['75plus', '150plus', '250plus'],
};

// Whether add-ons are available per SA
const SA_TV_ADDONS_ENABLED: Record<string, boolean> = {
  'sa-00912': true,
  'sa-01047': true,
};

// Add-ons currently active per SA
const SA_TV_ACTIVE_ADDONS: Record<string, string[]> = {
  'sa-00912': ['fanatic', 'cinemax'],
  'sa-01047': [],
};

const ADD_ONS = [
  { id: 'sport-tier', name: 'Sport Tier',   price: 9.99,  src: '/sport-tier.svg', plans: ['250plus'] },
  { id: 'fanatic',    name: 'FANatic',      price: 5.99,  src: '/fanatic.png',    plans: ['150plus'] },
  { id: 'cinemax',    name: 'Cinemax',      price: 12.99, src: '/cinemax.png',    plans: ['150plus', '250plus'] },
  { id: 'hbo',        name: 'HBO',          price: 14.99, src: '/hbo.png',        plans: ['150plus', '250plus'] },
  { id: 'starz',      name: 'STARZ/Encore', price: 8.99,  src: '/starz.png',      plans: ['150plus', '250plus'] },
  { id: 'showtime',   name: 'Showtime',     price: 10.99, src: '/showtime.png',   plans: ['150plus', '250plus'] },
];

function ChannelTile({ name, src, selected, onToggle, disabled, active }: {
  name: string; src: string; selected: boolean; onToggle: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <div className="relative w-full">
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
    </div>
  );
}

export function ChangeTelevisionPlan({ selectedSA, selectedInternetPlanId, previousLines, isDowngrade, isUpgrade, isMove2 = false, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangeTelevisionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const saId = selectedSA?.id ?? '';
  const activeAddOnIds = SA_TV_ACTIVE_ADDONS[saId] ?? [];
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set(activeAddOnIds));

  const currentPlanId = SA_TV_PLAN[selectedSA?.id ?? ''] ?? null;
  const higherInternetSelected = selectedInternetPlanId === '1gig' || selectedInternetPlanId === '2gig';
  const selectablePlanIds = (higherInternetSelected ? PLANS.map(p => p.id) : (SA_TV_SELECTABLE[selectedSA?.id ?? ''] ?? PLANS.map(p => p.id))).filter(id => id !== currentPlanId);
  const effectivePlanId = selectedPlan ?? currentPlanId;
  const planSupportsAddOns = effectivePlanId === '150plus' || effectivePlanId === '250plus';
  const saSupportsAddOns = higherInternetSelected ? true : (SA_TV_ADDONS_ENABLED[selectedSA?.id ?? ''] ?? true);
  const addOnsEnabled = planSupportsAddOns && saSupportsAddOns;
  const visibleAddOns = effectivePlanId === '250plus'
    ? ADD_ONS.filter(a => a.plans.includes('250plus'))
    : ADD_ONS.filter(a => a.plans.includes('150plus'));

  const activePlan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : undefined;

  const initialAddOnSet = new Set(activeAddOnIds);
  const addOnsChanged = selectedAddOns.size !== initialAddOnSet.size
    || [...selectedAddOns].some(id => !initialAddOnSet.has(id))
    || [...initialAddOnSet].some(id => !selectedAddOns.has(id));
  const canContinue = !!selectedPlan || addOnsChanged;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';
  const planLabel = activePlan ? activePlan.name : '';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Change Television Service</h1>
        <ContextBar action="change" selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={isMove2
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={isMove2 ? 3 : 2}
      />

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


          {/* Plan cards */}
          <div className="flex gap-4 mb-10">
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              const isSelectable = selectablePlanIds.includes(plan.id);
              const isSelected = selectedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    if (!isSelectable) return;
                    if (isSelected) {
                      setSelectedPlan(null);
                      setSelectedAddOns(new Set(activeAddOnIds));
                    } else {
                      setSelectedPlan(plan.id);
                      setSelectedAddOns(prev => {
                        const next = new Set(prev);
                        [...next].forEach(id => {
                          const a = ADD_ONS.find(x => x.id === id);
                          if (a && !a.plans.includes(plan.id)) next.delete(id);
                        });
                        return next;
                      });
                    }
                  }}
                  className={`flex-1 rounded-2xl border-2 p-6 text-center transition-all
                    ${!isSelectable
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
                    }`}
                >
                  {isCurrent && (
                    isMove2 ? (
                      selectedPlan ? (
                        <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5 mb-3">
                          <span style={{ textDecoration: 'line-through' }}>Move</span>
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5 mb-3">
                          Move
                        </span>
                      )
                    ) : (
                      <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-3">
                        Active
                      </span>
                    )
                  )}

                  <div className={`text-sm font-semibold uppercase tracking-widest mb-2
                    ${!isSelectable ? 'text-gray-300' : 'text-blue-600'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-5xl font-bold leading-none mb-1
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
                      {isCurrent && isMove2 ? (
                        selectedPlan ? (
                          <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                            <span style={{ textDecoration: 'line-through' }}>Moving</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-purple-100 text-purple-600">
                            Moving
                          </div>
                        )
                      ) : (
                        <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                          {isCurrent ? 'Your Current Plan' : 'Not Available'}
                        </div>
                      )}
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

          {/* Warning: active add-ons lost on plan switch */}
          {(() => {
            const lost = selectedPlan === '250plus'
              ? activeAddOnIds.map(id => ADD_ONS.find(a => a.id === id)!).filter(a => a && !a.plans.includes(selectedPlan))
              : [];
            return lost.length > 0 ? (
              <div className="flex items-start gap-3 p-3.5 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>{lost.map(a => a.name).join(', ')}</strong> {lost.length === 1 ? 'is' : 'are'} not available with {PLANS.find(p => p.id === selectedPlan)?.name} and will be removed from your plan.
                </p>
              </div>
            ) : null;
          })()}

          {/* Channel add-ons */}
          <div className="mb-10">
            <h3 className={`text-base font-semibold mb-2 ${addOnsEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
              Choose optional services{planLabel ? ` for ${planLabel}` : ''}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Digital Music channels are included with your selected plan. Enhance your channel lineup with the following add-ons:
            </p>
            <div className="grid grid-cols-5 gap-4">
              {visibleAddOns.map(addOn => {
                const isLosingToDowngrade = selectedPlan === '75plus' && activeAddOnIds.includes(addOn.id);
                return (
                <div key={addOn.id} className="flex flex-col items-center gap-2">
                  <div className="w-full">
                    <ChannelTile
                      name={addOn.name}
                      src={addOn.src}
                      selected={selectedAddOns.has(addOn.id)}
                      onToggle={() => toggleAddOn(addOn.id)}
                      disabled={!addOnsEnabled}
                      active={activeAddOnIds.includes(addOn.id)}
                    />
                  </div>
                  <span className={`text-xs font-semibold text-center
                    ${isLosingToDowngrade
                      ? 'text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5'
                      : !addOnsEnabled
                        ? 'text-gray-400'
                        : activeAddOnIds.includes(addOn.id)
                          ? selectedAddOns.has(addOn.id)
                            ? 'text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5'
                            : 'text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5'
                          : 'text-gray-700'
                    }`}>
                    {addOn.name}
                  </span>
                  <span className={`text-xs font-semibold ${addOnsEnabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    ${addOn.price.toFixed(2)}/mo
                  </span>
                </div>
                );
              })}
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
                if (!canContinue) return;
                const currentTvPlan = currentPlanId ? PLANS.find(p => p.id === currentPlanId) : undefined;
                const displayPlan = activePlan ?? currentTvPlan;
                const tvLines: CartLine[] = displayPlan ? [
                  { label: displayPlan.name, price: displayPlan.price, group: 'television' as const },
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.name, price: a.price, group: 'television' as const };
                  }),
                ] : [];
                const nonTvLines = previousLines.filter(l => l.group !== 'television');
                onNext(selectedPlan ?? currentPlanId ?? '', [...selectedAddOns], [...nonTvLines, ...tvLines]);
              }}
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

              {(() => {
                const nonTvLines = previousLines.filter(l => l.group !== 'television');
                const currentTvPlan = currentPlanId ? PLANS.find(p => p.id === currentPlanId) : undefined;
                const displayPlan = activePlan ?? currentTvPlan;

                // Lines kept/added (used for total)
                const keptTvLines: CartLine[] = displayPlan ? [
                  { label: displayPlan.name, price: displayPlan.price, group: 'television' as const },
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.name, price: a.price, group: 'television' as const };
                  }),
                ] : [];

                // Active add-ons that were deselected — show with strikethrough
                const removedAddOns = activeAddOnIds
                  .filter(id => !selectedAddOns.has(id))
                  .map(id => ADD_ONS.find(x => x.id === id)!)
                  .filter(Boolean);

                const allLines = [...nonTvLines, ...keptTvLines];
                const total = allLines.reduce((s, l) => s + l.price, 0);
                return allLines.length > 0 || removedAddOns.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {allLines.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{line.label}</span>
                        <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {removedAddOns.map(a => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-gray-400 line-through">{a.name}</span>
                        <span className="text-gray-400 line-through">${a.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {(isDowngrade || isUpgrade) && onPromoToggle && (
                      <PromoSection
                        selectedPromos={selectedPromos}
                        onToggle={onPromoToggle}
                        promoIds={isUpgrade ? ['apply-promo'] : undefined}
                        automaticPromoIds={isUpgrade ? ['price-lock'] : []}
                      />
                    )}
                    {(() => {
                      const discount = PROMOS.filter(p => selectedPromos.has(p.id) && p.discount > 0).reduce((s, p) => s + p.discount, 0);
                      const prevTotal = previousLines.reduce((s, l) => s + l.price, 0);
                      const diff = (total - discount) - prevTotal;
                      return (
                        <div className="border-t border-gray-100 pt-2 space-y-1.5">
                          {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-700">
                              <span>Promo discount</span>
                              <span className="font-medium">−${discount.toFixed(2)}</span>
                            </div>
                          )}
                          {diff !== 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Difference</span>
                              <span className={`font-semibold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-gray-700">Total</span>
                            <span className="text-gray-900">${(total - discount).toFixed(2)}/mo</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3">Select a plan to see pricing</p>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
