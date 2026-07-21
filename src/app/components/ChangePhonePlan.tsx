import { useState } from 'react';
import { MapPin, AlertTriangle, Info } from 'lucide-react';
import type { Service, CartLine } from '../App';
import { PromoSection, PROMOS } from './ChangePromos';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface ChangePhonePlanProps {
  selectedSA?: Service | null;
  previousLines: CartLine[];
  isDowngrade?: boolean;
  isUpgrade?: boolean;
  isMove2?: boolean;
  isPhoneStandalone?: boolean;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, lines: CartLine[]) => void;
}

const PLANS = [
  { id: 'phone-bundle', title: 'Phone Bundle', subtitle: '',                   price: 17.50, topPick: false },
];

type FeatureManageable = 'fixed' | 'removable' | 'attribute';

interface PhoneBundleFeature {
  id: string;
  name: string;
  basePrice: number;
  manageable: FeatureManageable;
  attributeOptions?: string[];
  attributePrices?: Record<string, number>;
  attributeDisplayPrices?: Record<string, string>;
  defaultAttribute?: string;
}

const LONG_DISTANCE_BUNDLE: PhoneBundleFeature = {
  id: 'long-distance', name: 'Long Distance', basePrice: 0, manageable: 'attribute',
  attributeOptions: ['Unlimited', '120 minutes'],
  attributePrices:  { '120 minutes': 0, Unlimited: 19.20 },
  attributeDisplayPrices: { '120 minutes': '$17.50/mo', Unlimited: '$19.20/mo' },
  defaultAttribute: 'Unlimited',
};

const LONG_DISTANCE_STANDALONE: PhoneBundleFeature = {
  id: 'long-distance', name: 'Long Distance', basePrice: 0, manageable: 'attribute',
  attributeOptions: ['Simplicity', 'Simplicity Gold', 'Simplicity Platinum', 'Unlimited'],
  attributePrices:  { Unlimited: 10.99, Simplicity: 0, 'Simplicity Gold': 3.95, 'Simplicity Platinum': 5.95 },
  defaultAttribute: 'Simplicity',
};

const CALL_WAITING_STANDALONE: PhoneBundleFeature = {
  id: 'call-waiting', name: 'Call Waiting', basePrice: 2.99, manageable: 'removable',
};

const CALLER_ID_STANDALONE: PhoneBundleFeature = {
  id: 'caller-id', name: 'Caller ID', basePrice: 5.99, manageable: 'removable',
};

const VOICEMAIL_STANDALONE: PhoneBundleFeature = {
  id: 'voicemail', name: 'Voicemail', basePrice: 4.95, manageable: 'removable',
};

const PHONE_BUNDLE_FEATURES: PhoneBundleFeature[] = [
  LONG_DISTANCE_BUNDLE,
  {
    id: 'directory-listing', name: 'Directory Listing',       basePrice: 0,    manageable: 'attribute',
    attributeOptions: ['Published', 'Unpublished', 'Unlisted'],
    attributePrices:  { Published: 0, Unpublished: 2.99, Unlisted: 2.99 },
    defaultAttribute: 'Published',
  },
  { id: 'call-waiting',      name: 'Call Waiting',            basePrice: 0,    manageable: 'fixed' },
  { id: 'caller-id',         name: 'Caller ID',               basePrice: 0,    manageable: 'fixed' },
  { id: 'voicemail',         name: 'Voicemail', basePrice: 0,    manageable: 'fixed' },
];

const PHONE_BUNDLE_BASE = 17.50;

const SA_PHONE_PLAN: Record<string, string> = {
  'sa-01047': 'local',
};

export function ChangePhonePlan({ selectedSA, previousLines, isDowngrade, isUpgrade, isMove2 = false, isPhoneStandalone = false, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangePhonePlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(isPhoneStandalone ? 'phone-bundle' : null);
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);
  const [removedFeatures, setRemovedFeatures] = useState<Set<string>>(new Set());
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({ 'directory-listing': 'Published', 'long-distance': isPhoneStandalone ? 'Simplicity' : 'Unlimited' });

  const features = PHONE_BUNDLE_FEATURES.map(f => {
    if (f.id === 'long-distance' && isPhoneStandalone) return LONG_DISTANCE_STANDALONE;
    if (f.id === 'call-waiting' && isPhoneStandalone) return CALL_WAITING_STANDALONE;
    if (f.id === 'caller-id' && isPhoneStandalone) return CALLER_ID_STANDALONE;
    if (f.id === 'voicemail' && isPhoneStandalone) return VOICEMAIL_STANDALONE;
    return f;
  });

  const currentPlanId = SA_PHONE_PLAN[selectedSA?.id ?? ''] ?? null;
  const activePlan    = PLANS.find(p => p.id === selectedPlan);
  const isBundle      = selectedPlan === 'phone-bundle';

  const attrPriceAdj = features
    .filter(f => f.manageable === 'attribute')
    .reduce((sum, f) => {
      const val = attributeValues[f.id] ?? f.defaultAttribute ?? '';
      return sum + (f.attributePrices?.[val] ?? 0);
    }, 0);
  const removableBaseTotal = features
    .filter(f => f.manageable === 'removable')
    .reduce((sum, f) => sum + f.basePrice, 0);
  const removedFeaturesAdj = [...removedFeatures].reduce((sum, id) => {
    const f = features.find(f => f.id === id);
    return sum + (f?.basePrice ?? 0);
  }, 0);
  const phoneBundleEffectivePrice = PHONE_BUNDLE_BASE + attrPriceAdj + removableBaseTotal - removedFeaturesAdj;

  const toggleRemoveFeature = (id: string) => {
    setRemovedFeatures(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePlanClick = (plan: typeof PLANS[0]) => {
    if (plan.id === currentPlanId) return;
    if (isPhoneStandalone) return;
    const next = selectedPlan === plan.id ? null : plan.id;
    setSelectedPlan(next);
    if (next !== 'phone-bundle') {
      setFeaturesExpanded(false);
      setRemovedFeatures(new Set());
      setAttributeValues({ 'directory-listing': 'Published', 'long-distance': 'Unlimited' });
    }
  };

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  /* ── Order Summary line computation ── */
  const buildSummaryLines = (): CartLine[] => {
    if (!selectedPlan || !activePlan) return [];
    const label = isBundle
      ? (isPhoneStandalone ? 'Phone Standalone' : 'Phone Bundle')
      : [activePlan.title, activePlan.subtitle].filter(Boolean).join(' ');
    // Main line = base + removable adj only (attrs shown as sub-items to avoid double-counting)
    const baseForSummary = isBundle
      ? PHONE_BUNDLE_BASE + removableBaseTotal - removedFeaturesAdj
      : activePlan.price;
    const main: CartLine = { label, price: baseForSummary, group: 'phone' };
    if (!isBundle) return [main];
    const mods: CartLine[] = [];
    removedFeatures.forEach(id => {
      const f = features.find(f => f.id === id);
      if (f) mods.push({ label: f.name, price: f.basePrice, group: 'phone-removed' });
    });
    features.filter(f => f.manageable === 'attribute').forEach(f => {
      const val = attributeValues[f.id] ?? f.defaultAttribute ?? '';
      const adj = f.attributePrices?.[val] ?? 0;
      if (adj > 0) {
        mods.push({ label: `${f.name} (${val})`, price: adj, group: 'phone-changed' });
      } else if (val !== f.defaultAttribute) {
        mods.push({ label: `${f.name} → ${val}`, price: 0, group: 'phone-changed' });
      }
    });
    return [main, ...mods];
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">{isMove2 ? 'Move Phone Service' : isPhoneStandalone ? 'Change Phone Standalone' : 'Change Phone Service'}</h1>
        <ContextBar action={isMove2 ? 'move2' : 'change'} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={isMove2
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={isMove2 ? 3 : 2}
      />

      <div className="flex gap-8 items-start">

        {/* ── Left: plan cards ── */}
        <div className="flex-1 min-w-0">

          {/* Skip Phone — only shown here when NOT using the inline layout (standalone or single-plan) */}
          {!isPhoneStandalone && PLANS.filter(p => p.id !== 'phone-bundle').length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={onSkip}
                className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
              >
                Skip Phone
              </button>
            </div>
          )}

          {/* Plan cards — left 1/3 stacked + right 2/3 Phone Bundle */}
          {(() => {
            const isSinglePlan = PLANS.filter(p => p.id !== 'phone-bundle').length === 0;
            const hidePrice = isPhoneStandalone || isSinglePlan;
            const renderCard = (plan: typeof PLANS[0]) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlan === plan.id;
              const displayPrice = plan.id === 'phone-bundle' ? phoneBundleEffectivePrice : plan.price;

              return (
                <div
                  key={plan.id}
                  onClick={() => handlePlanClick(plan)}
                  className={`relative w-full h-full rounded-[10px] border-2 p-8 text-center transition-all flex flex-col
                    ${isCurrent
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : isPhoneStandalone
                        ? 'border-blue-500 bg-blue-50 cursor-default'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
                    }`}
                >
                  <div className={`text-3xl font-black mb-3 ${isCurrent ? 'text-gray-300' : isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {plan.id === 'phone-bundle' && isPhoneStandalone ? 'Phone Standalone' : (plan.subtitle || plan.title)}
                  </div>

                  {(isCurrent || (isPhoneStandalone && plan.id === 'phone-bundle')) && (
                    isMove2 && isCurrent ? (
                      (selectedPlan && selectedPlan !== currentPlanId) ? (
                        <span className="self-center text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5 mb-2">
                          <span style={{ textDecoration: 'line-through' }}>Move</span>
                        </span>
                      ) : (
                        <span className="self-center text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5 mb-2">
                          Move
                        </span>
                      )
                    ) : (
                      <span className="self-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-2">
                        Active
                      </span>
                    )
                  )}
                  {plan.subtitle && (
                    <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isCurrent ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                      {plan.title}
                    </div>
                  )}
                  {!(plan.id === 'phone-bundle' && hidePrice) && (
                    <div className={`text-2xl font-bold mb-1 ${isCurrent ? 'text-gray-400' : 'text-gray-900'}`}>
                      ${displayPrice.toFixed(2)}
                      <span className="text-sm font-normal text-gray-400"> /month</span>
                    </div>
                  )}

                  {/* Phone Bundle: feature list — controls inline when selected */}
                  {plan.id === 'phone-bundle' && (
                    <div className="mt-2 mb-4 text-left border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
                      <div className="space-y-3">
                        {features.map(f => {
                          const isRemoved = removedFeatures.has(f.id);
                          const attrVal   = f.manageable === 'attribute' ? (attributeValues[f.id] ?? f.defaultAttribute ?? '') : null;
                          const attrAdj   = attrVal && f.attributePrices ? (f.attributePrices[attrVal] ?? 0) : 0;
                          const rowPrice  = f.basePrice + attrAdj;

                          return (
                            <div key={f.id} className="flex justify-between items-center gap-2">
                              {/* Name */}
                              <span className={`text-sm flex-1 flex items-center gap-1 ${isCurrent ? 'text-gray-400' : isSelected && isRemoved ? 'text-gray-400 line-through' : isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {f.name}
                                {f.id === 'long-distance' && isPhoneStandalone && (
                                  <span className="relative group/ldhelp inline-flex items-center flex-shrink-0">
                                    <Info className="w-3.5 h-3.5 text-blue-400 cursor-pointer hover:text-blue-600" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/ldhelp:opacity-100 transition-opacity pointer-events-none z-50 font-normal leading-relaxed">
                                      <p className="font-semibold mb-1.5 text-gray-200">Long Distance Plans</p>
                                      <div className="space-y-1">
                                        <div className="flex justify-between"><span className="text-gray-300">Simplicity</span><span className="text-gray-100">No fee · $0.21/min</span></div>
                                        <div className="flex justify-between"><span className="text-gray-300">Simplicity Gold</span><span className="text-gray-100">$3.95/mo · $0.17/min</span></div>
                                        <div className="flex justify-between"><span className="text-gray-300">Simplicity Platinum</span><span className="text-gray-100">$5.95/mo · $0.16/min</span></div>
                                        <div className="flex justify-between"><span className="text-gray-300">Unlimited</span><span className="text-gray-100">$10.00/mo · no per-min charge</span></div>
                                      </div>
                                      <p className="mt-1.5 text-gray-400 text-[10px]">Required for GPCLD: $1.99/mo</p>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                  </span>
                                )}
                              </span>

                              {/* Control (right side) */}
                              {isSelected && f.manageable === 'removable' ? (
                                <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                                  {f.basePrice > 0 && (
                                    <span className={`text-sm font-semibold ${isRemoved ? 'text-gray-400 line-through' : 'text-blue-800'}`}>
                                      +${f.basePrice.toFixed(2)}
                                    </span>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={!isRemoved}
                                    onChange={() => toggleRemoveFeature(f.id)}
                                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                  />
                                </label>
                              ) : isSelected && f.manageable === 'attribute' ? (
                                <select
                                  value={attributeValues[f.id] ?? f.defaultAttribute}
                                  onChange={e => setAttributeValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                                  className="text-sm border border-blue-200 rounded-md px-2 py-1 bg-white text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer flex-shrink-0"
                                >
                                  {f.attributeOptions?.map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt}{f.attributeDisplayPrices?.[opt]
                                        ? `  ${f.attributeDisplayPrices[opt]}`
                                        : f.attributePrices?.[opt] ? ` +$${f.attributePrices[opt].toFixed(2)}` : ''}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`text-sm flex-shrink-0 ${isCurrent ? 'text-gray-400' : isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                                  {rowPrice === 0 ? 'Included' : `$${rowPrice.toFixed(2)}`}
                                </span>
                              )}
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  )}

                  {!isPhoneStandalone && (isCurrent ? (
                    <div className="mt-auto pt-6">
                      <p className="text-xs text-gray-400 mb-4">Select another plan to upgrade or change</p>
                      {isMove2 ? (
                        (selectedPlan && selectedPlan !== currentPlanId) ? (
                          <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                            <span style={{ textDecoration: 'line-through' }}>Moving</span>
                          </div>
                        ) : (
                          <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-purple-100 text-purple-600">
                            Moving
                          </div>
                        )
                      ) : (
                        <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                          Your Current Plan
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-auto pt-6 flex justify-center">
                      <div className={`px-10 py-1.5 rounded-[10px] text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  ))}
                </div>
              );
            };

            if (isPhoneStandalone) {
              return (
                <div className="flex items-start gap-6 mb-10">
                  <div style={{ flex: '0 0 65%' }}>
                    {PLANS.filter(p => p.id === 'phone-bundle').map(plan => renderCard(plan))}
                  </div>
                  <div className="ml-auto pt-0">
                    <button
                      onClick={onSkip}
                      className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
                    >
                      Skip Phone
                    </button>
                  </div>
                </div>
              );
            }

            // Single-plan layout: only phone-bundle, no other plans
            const otherPlans = PLANS.filter(p => p.id !== 'phone-bundle');
            if (otherPlans.length === 0) {
              return (
                <div className="flex items-start gap-6 mb-10">
                  <div style={{ flex: '0 0 65%' }}>
                    {PLANS.filter(p => p.id === 'phone-bundle').map(plan => renderCard(plan))}
                  </div>
                  <div className="ml-auto pt-0">
                    <button
                      onClick={onSkip}
                      className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
                    >
                      Skip Phone
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex gap-6 mb-10 items-stretch">
                {/* Left 1/3: other plans stacked */}
                <div className="flex flex-col gap-4" style={{ flex: '0 0 33%' }}>
                  {otherPlans.map(plan => (
                    <div key={plan.id} className="flex-1 flex flex-col">{renderCard(plan)}</div>
                  ))}
                </div>
                {/* Right 2/3: Phone Bundle */}
                <div className="flex flex-col" style={{ flex: '0 0 calc(67% - 24px)' }}>
                  {PLANS.filter(p => p.id === 'phone-bundle').map(plan => (
                    <div key={plan.id} className="flex-1 flex flex-col">{renderCard(plan)}</div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                const summaryLines = buildSummaryLines();
                const nonPhoneLines = previousLines.filter(l => l.group !== 'phone' && l.group !== 'phone-removed' && l.group !== 'phone-changed');
                onNext(selectedPlan, [...nonPhoneLines, ...summaryLines]);
              }}
              disabled={!selectedPlan}
              className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
                ${selectedPlan ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-[10px] border border-gray-200 bg-white p-6">
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Recurring Charges</p>

              {(() => {
                const summaryLines = buildSummaryLines();
                const mainPhoneLine = summaryLines.find(l => l.group === 'phone');
                const phoneRemovedLines = summaryLines.filter(l => l.group === 'phone-removed');
                const phoneChangedLines = summaryLines.filter(l => l.group === 'phone-changed');

                const nonPhoneLines = previousLines.filter(l => l.group !== 'phone' && l.group !== 'phone-removed' && l.group !== 'phone-changed');
                const allDisplayLines = mainPhoneLine ? [...nonPhoneLines, mainPhoneLine] : nonPhoneLines;
                const total = allDisplayLines.reduce((s, l) => s + l.price, 0) + phoneChangedLines.reduce((s, l) => s + l.price, 0);

                return allDisplayLines.length > 0 || summaryLines.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {allDisplayLines.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{line.label}</span>
                        <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Phone Bundle sub-items */}
                    {phoneRemovedLines.map((line, i) => (
                      <div key={`rem-${i}`} className="flex justify-between items-center text-xs pl-4 border-l-2 border-red-200">
                        <span className="text-gray-400 line-through">{line.label}</span>
                        <span className="font-medium text-red-500">−${line.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {phoneChangedLines.map((line, i) => (
                      <div key={`chg-${i}`} className="flex justify-between items-center text-xs pl-4 border-l-2 border-blue-200">
                        <span className="text-blue-700">{line.label}</span>
                        {line.price > 0 && <span className="font-medium text-blue-800">+${line.price.toFixed(2)}</span>}
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
                          {isMove2 && (
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700">Move fee (one-time)</span>
                                <button
                                  onClick={() => setMoveFeeApplied(v => !v)}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${moveFeeApplied ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${moveFeeApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                </button>
                              </div>
                              <span className={moveFeeApplied ? 'text-gray-900' : 'text-gray-400 line-through'}>$65.00</span>
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
                  <>
                    <p className="text-sm text-gray-400 mb-3">Select a plan to see pricing</p>
                    {isMove2 && (
                      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Move fee (one-time)</span>
                          <button
                            onClick={() => setMoveFeeApplied(v => !v)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${moveFeeApplied ? 'bg-blue-600' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${moveFeeApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <span className={moveFeeApplied ? 'text-gray-900' : 'text-gray-400 line-through'}>$65.00</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
