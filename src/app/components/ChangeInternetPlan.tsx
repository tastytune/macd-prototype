import { useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import type { Service, CartLine } from '../App';

interface ChangeInternetPlanProps {
  selectedSA?: Service | null;
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, addOns: string[], lines: CartLine[]) => void;
}

const PLANS = [
  { id: '200mbps', speed: '200', unit: 'Mbps', price: 55.95 },
  { id: '1gig',   speed: '1',   unit: 'Gig',  price: 99.95 },
  { id: '2gig',   speed: '2',   unit: 'Gig',  price: 124.95 },
];

// Maps SA id → current internet plan id
const SA_INTERNET_PLAN: Record<string, string> = {
  'sa-00912': '2gig',
  'sa-01047': '200mbps',
};

const ADD_ONS = [
  { id: 'whole-home-wifi',   label: 'Whole Home Wi-Fi',  price: 5.95, isCurrentlyActive: true },
  { id: 'service-assurance', label: 'Service Assurance', price: 3.49, isCurrentlyActive: false },
];

export function ChangeInternetPlan({ selectedSA, onBack, onSkip, onNext }: ChangeInternetPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(
    new Set(ADD_ONS.filter(a => a.isCurrentlyActive).map(a => a.id))
  );

  const currentPlanId = SA_INTERNET_PLAN[selectedSA?.id ?? ''] ?? '200mbps';
  const currentPlan = PLANS.find(p => p.id === currentPlanId)!;
  const activePlan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : currentPlan;
  const planLabel = activePlan ? `${activePlan.speed} ${activePlan.unit}` : '';

  const initialAddOnIds = new Set(ADD_ONS.filter(a => a.isCurrentlyActive).map(a => a.id));
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

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      {/* Account context */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Change Internet Service</h1>
        <p className="text-gray-500 text-sm">
          Account: <span className="font-medium text-gray-700">Robert Johnson · ACC-004821</span>
          <span className="mx-2 text-gray-300">·</span>
          Service account: <span className="font-medium text-gray-700">{saName}</span>
        </p>
      </div>

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
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlan === plan.id;
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
                  {isCurrent && (
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-3">
                      Active
                    </span>
                  )}

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
                      <div className="w-full py-2 rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-default">
                        Your Current Plan
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

          {/* Add-ons */}
          <div className="mb-10">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Choose optional services for {planLabel}
            </h3>
            <div className="space-y-2.5">
              {ADD_ONS.map(addOn => {
                const isChecked = selectedAddOns.has(addOn.id);
                return (
                  <button
                    key={addOn.id}
                    onClick={() => toggleAddOn(addOn.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${isChecked ? 'border-blue-600' : 'border-gray-300'}`}>
                      {isChecked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>

                    <span className="flex-1 text-sm font-medium text-gray-800">{addOn.label}</span>

                    {addOn.isCurrentlyActive && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5">
                        Active
                      </span>
                    )}

                    <span className="text-sm text-gray-500">— ${addOn.price.toFixed(2)}/each</span>
                    <Info className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
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
                const planToSubmit = planChanged ? PLANS.find(p => p.id === selectedPlan)! : currentPlan;
                const lines: CartLine[] = [
                  { label: `Internet ${planToSubmit.speed} ${planToSubmit.unit}`, price: planToSubmit.price, group: 'internet' },
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

              {selectedPlan ? (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Internet {activePlan?.speed} {activePlan?.unit}</span>
                    <span className="font-medium text-gray-900">${activePlan?.price.toFixed(2)}</span>
                  </div>
                  {[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id);
                    if (!a) return null;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{a.label}</span>
                        <span className="font-medium text-gray-900">${a.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-gray-700">Total</span>
                    <span className="text-gray-900">${planTotal.toFixed(2)}/mo</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-3">Select a plan to see pricing</p>
              )}

              <p className="text-xs text-gray-400">Billed monthly</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
