import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Service, CartLine } from '../App';

interface ChangePhonePlanProps {
  selectedSA?: Service | null;
  previousLines: CartLine[];
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, lines: CartLine[]) => void;
}

const PLANS = [
  {
    id: 'local',
    title: 'Unlimited',
    subtitle: 'Local Calling',
    price: 15.95,
    topPick: false,
  },
  {
    id: 'local-ld',
    title: 'Unlimited',
    subtitle: 'Local & Long Distance',
    price: 21.95,
    topPick: true,
  },
];

// sa-01047 has Phone Bundle → local calling; sa-00912 has no phone → null
const SA_PHONE_PLAN: Record<string, string> = {
  'sa-01047': 'local',
};

export function ChangePhonePlan({ selectedSA, previousLines, onBack, onSkip, onNext }: ChangePhonePlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlanId = SA_PHONE_PLAN[selectedSA?.id ?? ''] ?? null;
  const activePlan = PLANS.find(p => p.id === selectedPlan);

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      {/* Account context */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Change Phone Service</h1>
        <p className="text-gray-500 text-sm">
          Account: <span className="font-medium text-gray-700">Robert Johnson · ACC-004821</span>
          <span className="mx-2 text-gray-300">·</span>
          Service account: <span className="font-medium text-gray-700">{saName}</span>
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Left: plan selection ── */}
        <div className="flex-1 min-w-0">

          {/* Skip Phone */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onSkip}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 tracking-wide uppercase transition-colors"
            >
              Skip Phone
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-5">Select a new plan to change your current phone service</p>

          {/* Plan cards */}
          <div className="flex gap-6 mb-10 max-w-2xl">
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => { if (!isCurrent) setSelectedPlan(isSelected ? null : plan.id); }}
                  className={`relative flex-1 rounded-2xl border-2 p-8 text-center transition-all
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

                  <div className={`text-3xl font-black mb-1
                    ${isCurrent ? 'text-gray-300' : isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {plan.title}
                  </div>
                  <div className={`text-sm font-semibold uppercase tracking-widest mb-5
                    ${isCurrent ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {plan.subtitle}
                  </div>
                  <div className={`text-2xl font-bold mb-1
                    ${isCurrent ? 'text-gray-400' : 'text-gray-900'}`}>
                    ${plan.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400"> /month</span>
                  </div>

                  {isCurrent ? (
                    <div className="mt-6">
                      <p className="text-xs text-gray-400 mb-4">Select another plan to upgrade or change</p>
                      <div className="w-full py-2 rounded-lg bg-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-default">
                        Your Current Plan
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-6 w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors
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
                const phoneLines: CartLine[] = [{ label: `${activePlan.title} ${activePlan.subtitle}`, price: activePlan.price, group: 'phone' }];
                onNext(selectedPlan, [...previousLines, ...phoneLines]);
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
                const phoneLines: CartLine[] = selectedPlan && activePlan
                  ? [{ label: `${activePlan.title} ${activePlan.subtitle}`, price: activePlan.price, group: 'phone' as const }]
                  : [];
                const allLines = [...previousLines, ...phoneLines];
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
