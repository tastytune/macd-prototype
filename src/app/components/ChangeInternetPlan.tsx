import { useState } from 'react';
import { MapPin, Info, AlertTriangle } from 'lucide-react';
import type { Service, CartLine } from '../App';
import type { WorkOrderResult } from './FollowOnWorkOrder';
import { PromoSection, PROMOS } from './ChangePromos';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface ChangeInternetPlanProps {
  selectedSA?: Service | null;
  previousLines?: CartLine[];
  isDowngrade?: boolean;
  isMove2?: boolean;
  isCoaxMove?: boolean;
  workOrder?: WorkOrderResult | null;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, addOns: string[], lines: CartLine[]) => void;
}

const PLANS = [
  { id: '200mbps', speed: '200', unit: 'Mbps', price: 55.95 },
  { id: '1gig',   speed: '1',   unit: 'Gbps',  price: 99.95 },
  { id: '2gig',   speed: '2',   unit: 'Gbps',  price: 124.95 },
];

// Coax prices for Move 2 (technology change — fiber 2Gbps unavailable at coax destination)
const COAX_PLANS = [
  { id: '200mbps', speed: '200', unit: 'Mbps', price: 79.95 },
  { id: '1gig',   speed: '1',   unit: 'Gbps',  price: 99.95 },
];

// Maps SA id → current internet plan id
const SA_INTERNET_PLAN: Record<string, string> = {
  'sa-00912': '200mbps',
  'sa-01047': '200mbps',
  'sa-02031': 'none',
};

// SAs that have an active Price Lock promotion
const SA_PRICE_LOCK = new Set(['sa-00912', 'sa-01047']);

// Which Tech Home product each SA currently has (null = none)
const SA_TECH_HOME: Record<string, string | null> = {
  'sa-00912': 'tech-home-support',
  'sa-01047': 'tech-home-protect',
  'sa-02031': null,
};

const ADD_ONS = [
  { id: 'whole-home-wifi',   label: 'Elite Wi-Fi',  price: 5.95,  group: null },
  { id: 'service-assurance', label: 'Service Assurance', price: 3.49,  group: null },
  { id: 'tech-home-protect', label: 'Tech Home Protect', price: 5.99,  group: 'tech-home' },
  { id: 'tech-home-support', label: 'Tech Home Support', price: 14.99, group: 'tech-home' },
];

export function ChangeInternetPlan({ selectedSA, previousLines = [], isDowngrade, isMove2 = false, isCoaxMove = false, workOrder = null, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangeInternetPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(() => {
    if (!isMove2 || !isCoaxMove) return null;
    const planId = SA_INTERNET_PLAN[selectedSA?.id ?? ''] ?? '2gig';
    if (planId === '2gig') return '1gig';       // closest coax equivalent
    if (planId === '1gig' || planId === '200mbps') return planId;
    return null;
  });
  const currentTechHome = SA_TECH_HOME[selectedSA?.id ?? ''] ?? null;
  const [showLegacyWarning, setShowLegacyWarning] = useState(false);
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(() => {
    const initial = new Set<string>(['whole-home-wifi']);
    if (currentTechHome) initial.add(currentTechHome);
    return initial;
  });

  const currentPlanId = SA_INTERNET_PLAN[selectedSA?.id ?? ''] ?? '2gig';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) ?? null;
  // M03 coax move: use coax plans (technology change, 2Gbps unavailable at coax destination)
  const visiblePlans = (isMove2 && isCoaxMove) ? COAX_PLANS : PLANS;
  const activePlan = selectedPlan ? visiblePlans.find(p => p.id === selectedPlan) : undefined;
  const planLabel = activePlan
    ? `Internet ${activePlan.speed} ${activePlan.unit}`
    : currentPlan ? `Internet ${currentPlan.speed} ${currentPlan.unit}` : 'Internet';

  // Compute upgrade/downgrade locally so promos show before the user clicks Continue
  const currentPlanIdx = PLANS.findIndex(p => p.id === currentPlanId);
  const selectedPlanIdx = selectedPlan ? PLANS.findIndex(p => p.id === selectedPlan) : -1;
  const localIsDowngrade = selectedPlanIdx !== -1 && selectedPlanIdx < currentPlanIdx;
  const localIsUpgrade   = selectedPlanIdx !== -1 && selectedPlanIdx > currentPlanIdx;
  const effectiveIsDowngrade = localIsDowngrade || !!isDowngrade;
  const effectiveIsUpgrade   = localIsUpgrade && !effectiveIsDowngrade;
  const showPromos = effectiveIsDowngrade || effectiveIsUpgrade || selectedPromos.size > 0;

  const initialAddOnIds = new Set<string>(['whole-home-wifi', ...(currentTechHome ? [currentTechHome] : [])]);
  const addOnsChanged = selectedAddOns.size !== initialAddOnIds.size
    || [...selectedAddOns].some(id => !initialAddOnIds.has(id))
    || [...initialAddOnIds].some(id => !selectedAddOns.has(id));
  const planChanged = !!selectedPlan && selectedPlan !== currentPlanId;
  const canContinue = planChanged || addOnsChanged;

  const addOnTotal = [...selectedAddOns].reduce((sum, id) => {
    const a = ADD_ONS.find(x => x.id === id);
    return sum + (a?.price ?? 0);
  }, 0);
  const planTotal = (activePlan?.price ?? 0) + addOnTotal;

  // Baseline SA lines used when no previousLines exist yet (first visit)
  const syntheticCurrentLines = [
    ...(currentPlan ? [{ label: `Internet ${currentPlan.speed} ${currentPlan.unit}`, price: currentPlan.price, group: 'internet' as const }] : []),
    { label: 'Elite Wi-Fi', price: 5.95, group: 'internet' as const },
    ...(currentTechHome ? (() => { const a = ADD_ONS.find(x => x.id === currentTechHome)!; return [{ label: a.label, price: a.price, group: 'internet' as const }]; })() : []),
  ];
  const effectivePreviousLines = previousLines.length > 0 ? previousLines : syntheticCurrentLines;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const addOn = ADD_ONS.find(a => a.id === id);
        if (addOn?.group) {
          ADD_ONS.filter(a => a.group === addOn.group && a.id !== id).forEach(a => next.delete(a.id));
        }
        next.add(id);
      }
      return next;
    });
  };

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">{isMove2 ? 'Move Internet Service' : 'Change Internet Service'}</h1>
        <ContextBar action={isMove2 ? 'move2' : 'change'} selectedSA={selectedSA} />
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
          {/* Skip Internet */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onSkip}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
            >
              Skip Internet
            </button>
          </div>


          {/* Plan cards */}
          <div className="flex gap-4 mb-10">
            {visiblePlans.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlan === plan.id;

              if (isMove2 && isCoaxMove) {
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
                    className={`flex-1 rounded-2xl border-2 p-6 text-center flex flex-col cursor-pointer transition-all
                      ${isSelected
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'
                      }`}
                  >
                    <div className="flex justify-center mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border
                        ${isSelected
                          ? 'bg-orange-100 text-orange-700 border-orange-300'
                          : 'bg-orange-50 text-orange-600 border-orange-200'
                        }`}>
                        Coax replacement
                      </span>
                    </div>
                    <div className={`text-6xl font-bold leading-none mb-1 ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                      {plan.speed}
                    </div>
                    <div className={`text-base font-medium mb-4 ${isSelected ? 'text-orange-500' : 'text-gray-500'}`}>
                      {plan.unit}
                    </div>
                    <div className={`text-lg font-bold mb-1 ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>
                      ${plan.price.toFixed(2)}
                      <span className="text-sm font-normal text-gray-400"> /month</span>
                    </div>
                    <div className={`mt-5 w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors
                      ${isSelected ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={plan.id}
                  onClick={() => { if (!isCurrent) setSelectedPlan(isSelected ? null : plan.id); }}
                  className={`flex-1 rounded-2xl border-2 p-6 text-center transition-all
                    ${isCurrent
                      ? 'border-gray-200 bg-gray-50 cursor-default'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
                    }`}
                >
                  {/* Fixed-height pill row */}
                  <div className="min-h-[1.75rem] flex flex-wrap items-center justify-center gap-1.5 mb-3">
                    {isCurrent && (
                      <>
                        {isMove2 ? (
                          selectedPlan ? (
                            <span className="inline-block text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 line-through">
                              Move
                            </span>
                          ) : (
                            <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5">
                              Move
                            </span>
                          )
                        ) : selectedPlan ? (
                          <span className="inline-block text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 line-through">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5">
                            Active
                          </span>
                        )}
                        {!isMove2 && SA_PRICE_LOCK.has(selectedSA?.id ?? '') && !selectedPlan && (
                          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-full px-2.5 py-0.5">
                            Price Lock
                          </span>
                        )}
                      </>
                    )}
                    {!isCurrent && workOrder && plan.id === workOrder.upsellPlanId && (
                      <>
                        <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-0.5">
                          Installing
                        </span>
                        <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                          {workOrder.id}
                        </span>
                      </>
                    )}
                    {isSelected && showPromos && (
                      <>
                        {(effectiveIsUpgrade || (effectiveIsDowngrade && selectedPromos.has('price-lock'))) && (
                          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-full px-2.5 py-0.5">
                            Price Lock
                          </span>
                        )}
                        {selectedPromos.has('apply-promo') && (
                          <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5">
                            Promo
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className={`text-6xl font-bold leading-none mb-1
                    ${isCurrent ? 'text-gray-300' : 'text-gray-900'}`}>
                    {plan.speed}
                  </div>
                  <div className={`text-base font-medium mb-4
                    ${isCurrent ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.unit}
                  </div>
                  <div className={`text-lg font-bold mb-1
                    ${isCurrent ? 'text-gray-400' : 'text-gray-900'}`}>
                    ${plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400"> /month</span>
                  </div>

                  {isCurrent ? (
                    <div className="mt-5">
                      <p className="text-xs text-gray-400 mb-4">Select another plan to upgrade or change</p>
                      {isMove2 ? (
                        selectedPlan ? (
                          <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-red-50 text-red-400 line-through border border-red-200">
                            Moving
                          </div>
                        ) : (
                          <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-purple-100 text-purple-600">
                            Moving
                          </div>
                        )
                      ) : selectedPlan ? (
                        <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-red-50 text-red-400 line-through border border-red-200">
                          Your Current Plan
                        </div>
                      ) : (
                        <div className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                          Your Current Plan
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

          {/* Add-ons */}
          <div className="mb-10">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Choose optional services for {planLabel}
            </h3>
            <div className="space-y-2.5">
              {ADD_ONS.filter(a => !a.group).map(addOn => {
                const isChecked = selectedAddOns.has(addOn.id);
                const wasActive = initialAddOnIds.has(addOn.id);
                const removing = wasActive && !isChecked;
                return (
                  <button
                    key={addOn.id}
                    onClick={() => toggleAddOn(addOn.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left
                      ${removing
                        ? 'border-red-300 bg-red-50'
                        : isChecked
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${isChecked ? 'border-blue-600 bg-blue-600' : removing ? 'border-red-300 bg-white' : 'border-gray-300 bg-white'}`}>
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${removing ? 'text-red-700 line-through' : 'text-gray-800'}`}>{addOn.label}</span>
                    {wasActive && (
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border
                        ${removing
                          ? 'text-red-500 bg-red-50 border-red-200 line-through'
                          : 'text-green-700 bg-green-100 border-green-200'}`}>
                        Active
                      </span>
                    )}
                    <span className={`text-sm ${removing ? 'text-red-400 line-through' : 'text-gray-500'}`}>${addOn.price.toFixed(2)}/mo</span>
                    <Info className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}

              {/* Tech Home — show only the SA's current product (read-only, can deselect to remove) */}
              {currentTechHome && (() => {
                const addOn = ADD_ONS.find(a => a.id === currentTechHome)!;
                const isChecked = selectedAddOns.has(addOn.id);
                const isLegacy = currentTechHome === 'tech-home-support';
                const handleTechHomeClick = () => {
                  if (isLegacy && isChecked) {
                    setShowLegacyWarning(true);
                  } else {
                    toggleAddOn(addOn.id);
                  }
                };
                return (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Tech Home</p>
                    <button
                      onClick={handleTechHomeClick}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left
                        ${!isChecked ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        ${isChecked ? 'border-blue-600' : 'border-red-300'}`}>
                        {isChecked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <span className={`flex-1 text-sm font-medium ${isChecked ? 'text-gray-800' : 'text-red-700 line-through'}`}>{addOn.label}</span>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 border
                        ${isChecked
                          ? 'text-green-700 bg-green-100 border-green-200'
                          : 'text-red-500 bg-red-50 border-red-200 line-through'}`}>
                        Active
                      </span>
                      <span className={`text-sm ${isChecked ? 'text-gray-500' : 'text-red-400 line-through'}`}>${addOn.price.toFixed(2)}/mo</span>
                      <Info className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  </div>
                );
              })()}
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
                const planToSubmit = planChanged ? visiblePlans.find(p => p.id === selectedPlan)! : currentPlan;
                const lines: CartLine[] = [
                  { label: `Internet ${planToSubmit.speed} ${planToSubmit.unit}`, price: planToSubmit.price, group: 'internet' },
                  ...(initialAddOnIds.has('whole-home-wifi') && !selectedAddOns.has('whole-home-wifi')
                    ? [{ label: 'Core Wi-Fi', price: 0, group: 'internet' as const }]
                    : []),
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.label, price: a.price, group: 'internet' as const };
                  }),
                ];
                onNext(planToSubmit.id, [...selectedAddOns], lines);
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

            {/* Service address */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Service Address</p>
              <div className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-snug">{saAddress}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            {/* MRC */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Monthly Recurring Charges
              </p>

              {(() => {
                const ADD_ON_LABELS = new Set(ADD_ONS.map(a => a.label));
                const nonInternetLines = effectivePreviousLines.filter(l => l.group !== 'internet');
                const oldInternetPlanLines = effectivePreviousLines.filter(l => l.group === 'internet' && !ADD_ON_LABELS.has(l.label));
                const oldInternetAddOnLines = effectivePreviousLines.filter(l => l.group === 'internet' && ADD_ON_LABELS.has(l.label));
                const oldAddOnLabelSet = new Set(oldInternetAddOnLines.map(l => l.label));
                const newlyAddedAddOns = [...selectedAddOns]
                  .map(id => ADD_ONS.find(x => x.id === id)!)
                  .filter(a => a && !oldAddOnLabelSet.has(a.label));
                const promoDiscount = PROMOS.filter(p => selectedPromos.has(p.id) && p.discount > 0).reduce((s, p) => s + p.discount, 0);

                const effectivePlan = activePlan ?? currentPlan;

                if (effectivePlan && (planChanged || addOnsChanged)) {
                  const keptAddOnTotal = oldInternetAddOnLines
                    .filter(l => { const a = ADD_ONS.find(x => x.label === l.label); return a ? selectedAddOns.has(a.id) : false; })
                    .reduce((s, l) => s + l.price, 0);
                  const newAddOnTotal = newlyAddedAddOns.reduce((s, a) => s + a.price, 0);
                  const fullTotal = nonInternetLines.reduce((s, l) => s + l.price, 0) + effectivePlan.price + keptAddOnTotal + newAddOnTotal;

                  return (
                    <div className="space-y-2 mb-3">
                      {/* Non-internet lines – unchanged */}
                      {nonInternetLines.map((line, i) => (
                        <div key={`ni-${i}`} className="flex justify-between text-sm">
                          <span className="text-gray-600">{line.label}</span>
                          <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {/* Old internet plan – struck if changed, normal if not */}
                      {oldInternetPlanLines.map((line, i) => (
                        <div key={`op-${i}`} className="flex justify-between text-sm">
                          <span className={planChanged ? 'text-red-400' : 'text-gray-600'}>{line.label}</span>
                          <span className={planChanged ? 'text-red-400' : 'font-medium text-gray-900'}>${line.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {/* Old add-ons – struck if deselected, normal if kept */}
                      {oldInternetAddOnLines.flatMap((line, i) => {
                        const a = ADD_ONS.find(x => x.label === line.label);
                        const kept = a ? selectedAddOns.has(a.id) : false;
                        const rows = [
                          <div key={`oa-${i}`} className="flex justify-between text-sm">
                            <span className={kept ? 'text-gray-600' : 'text-red-400'}>{line.label}</span>
                            <span className={kept ? 'font-medium text-gray-900' : 'text-red-400'}>${line.price.toFixed(2)}</span>
                          </div>
                        ];
                        if (a?.id === 'whole-home-wifi' && !kept) {
                          rows.push(
                            <div key={`core-wifi-${i}`} className="flex justify-between text-sm">
                              <span className="text-gray-600">Core Wi-Fi</span>
                              <span className="font-medium text-gray-900">$0.00</span>
                            </div>
                          );
                        }
                        return rows;
                      })}
                      {/* New internet plan – only when plan actually changed */}
                      {planChanged && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Internet {effectivePlan.speed} {effectivePlan.unit}</span>
                          <span className="font-medium text-gray-900">${effectivePlan.price.toFixed(2)}</span>
                        </div>
                      )}
                      {/* Newly added add-ons */}
                      {newlyAddedAddOns.map(a => (
                        <div key={a.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{a.label}</span>
                          <span className="font-medium text-gray-900">${a.price.toFixed(2)}</span>
                        </div>
                      ))}
                      {showPromos && onPromoToggle && (
                        <PromoSection
                          selectedPromos={selectedPromos}
                          onToggle={onPromoToggle}
                          promoIds={effectiveIsUpgrade ? ['apply-promo'] : undefined}
                          automaticPromoIds={effectiveIsUpgrade ? ['price-lock'] : []}
                        />
                      )}
                      <div className="border-t border-gray-100 pt-2 space-y-1.5">
                        {promoDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span>Promo discount</span>
                            <span className="font-medium">−${promoDiscount.toFixed(2)}</span>
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
                        {(() => {
                          const prevTotal = effectivePreviousLines.reduce((s, l) => s + l.price, 0);
                          const diff = (fullTotal - promoDiscount) - prevTotal;
                          if (diff === 0) return null;
                          return (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Difference</span>
                              <span className={`font-semibold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-700">Total</span>
                          <span className="text-gray-900">${(fullTotal - promoDiscount + (isMove2 && moveFeeApplied ? 65 : 0)).toFixed(2)}/mo</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 mb-3">
                    {effectivePreviousLines.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{line.label}</span>
                        <span className="font-medium text-gray-900">${line.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {isMove2 && (
                      <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
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
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-gray-700">Total</span>
                      <span className="text-gray-900">${(effectivePreviousLines.reduce((s, l) => s + l.price, 0) + (isMove2 && moveFeeApplied ? 65 : 0)).toFixed(2)}/mo</span>
                    </div>
                  </div>
                );

                return <p className="text-sm text-gray-400 mb-3">Select a plan to see pricing</p>;
              })()}

            </div>
          </div>
        </div>

      </div>

      {/* Legacy product disconnect warning modal */}
      {showLegacyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Legacy product — cannot be reconnected</h3>
                <p className="text-sm text-gray-600">
                  <strong>Tech Home Support</strong> is a legacy product that is no longer available for new customers.
                  If you disconnect it now, <strong>it cannot be reconnected in the future</strong>.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6 pl-14">Are you sure you want to proceed with the disconnection?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLegacyWarning(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLegacyWarning(false);
                  toggleAddOn('tech-home-support');
                }}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Disconnect anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
