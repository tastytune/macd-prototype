import { ChevronRight, Lock } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';

interface MoveServicesStep3Props {
  scenario: string;
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: (serviceIds: string[]) => void;
}

const MOVE_STEPS = ['Account', 'Destination', 'Services', 'Dates', 'Review'];
const CURRENT_STEP = 2;

interface MoveServiceItem {
  id: string;
  name: string;
  detail: string;
  price: number;
  summaryLabel: string;
}

const SERVICES: MoveServiceItem[] = [
  { id: 'fiber',     name: 'Fiber Internet 1 Gbps',    detail: 'Symmetric · Bundle primary · Price lock 14 mo.', price: 79.99, summaryLabel: 'Fiber' },
  { id: 'voice',     name: 'Voice — (217) 555-0148',   detail: 'Bundle component · Number portable',             price: 19.99, summaryLabel: 'Voice' },
  { id: 'streaming', name: 'Streaming TV add-on',       detail: 'Optional · Available at destination',            price: 15.00, summaryLabel: 'Streaming' },
  { id: 'wifi',      name: 'WiFi equipment rental',     detail: 'Requires Internet service',                      price: 10.00, summaryLabel: 'WiFi' },
];

export function MoveServicesStep3({ scenario, selectedSA, onBack, onNext }: MoveServicesStep3Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(SERVICES.map(s => s.id)));

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const originAddress = selectedSA?.address ?? '742 Evergreen Terrace, Springfield, IL 62701';

  const currentMRC = SERVICES.reduce((sum, s) => sum + s.price, 0);
  const newMRC = SERVICES.filter(s => selected.has(s.id)).reduce((sum, s) => sum + s.price, 0);
  const diff = newMRC - currentMRC;

  const subtitle = scenario === 'M01'
    ? 'All services selected by default (M01).'
    : 'Select the services to include in the partial move (M02).';

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 mb-6 text-sm flex-wrap">
        {MOVE_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <span className={
              i < CURRENT_STEP
                ? 'font-semibold text-blue-600'
                : i === CURRENT_STEP
                ? 'font-semibold text-gray-900'
                : 'text-gray-400'
            }>
              {step}
            </span>
          </span>
        ))}
      </nav>

      {/* Context bar */}
      <div className="flex items-stretch rounded-xl border border-[#d9a0d9] bg-[#faf0fa] overflow-hidden mb-8 text-sm">
        <div className="flex items-center px-4 py-3 bg-[#f3e8f3] border-r border-[#d9a0d9]">
          <span className="text-xs font-bold tracking-widest uppercase text-[#800080]">Moving</span>
        </div>
        <div className="flex items-center px-5 py-3 border-r border-[#d9a0d9]">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Customer</p>
            <p className="font-medium text-gray-900">Robert Johnson · ACC-004821</p>
          </div>
        </div>
        <div className="flex items-center px-5 py-3 border-r border-[#d9a0d9]">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Service account</p>
            <p className="font-medium text-gray-900">{saName}</p>
          </div>
        </div>
        <div className="flex items-center px-5 py-3">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Origin</p>
            <p className="font-medium text-gray-900">{originAddress}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Services to move</h2>
        <p className="text-sm text-gray-500 mb-8">{subtitle}</p>

        <div className="flex gap-8">

          {/* Left: service cards */}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current services</p>
            <div className="flex flex-col gap-3">
              {SERVICES.map(svc => {
                const isChecked = selected.has(svc.id);
                return (
                  <button
                    key={svc.id}
                    onClick={() => toggle(svc.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full
                      ${isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    {/* Checkbox */}
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center
                      ${isChecked ? 'bg-blue-600 border-2 border-blue-600' : 'border-2 border-gray-300 bg-white'}`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                        <p className="text-sm font-medium text-gray-700 ml-4 flex-shrink-0">${svc.price.toFixed(2)}/mo</p>
                      </div>
                      <p className="text-xs text-gray-500">{svc.detail}</p>
                      <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        → Moving
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: price summary */}
          <div className="w-56 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Price summary</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Current MRC</span>
                <span className="font-semibold text-gray-900">${currentMRC.toFixed(2)}</span>
              </div>
              <hr className="border-gray-200 mb-3" />
              {SERVICES.map(svc => (
                <div key={svc.id} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500">{svc.summaryLabel}</span>
                  <span className="text-gray-700">${svc.price.toFixed(2)}</span>
                </div>
              ))}
              <hr className="border-gray-200 mt-3 mb-3" />
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-900">New MRC</span>
                <span className="font-semibold text-gray-900">${newMRC.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Difference</span>
                <span className={`font-semibold ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diff === 0 ? '$0.00' : diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                </span>
              </div>

              {/* Price lock note */}
              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <Lock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-blue-600 leading-snug">Price lock continues — clock does not reset.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation */}
        <div className="flex justify-end gap-3 mt-10">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onNext([...selected])}
            disabled={selected.size === 0}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
              ${selected.size > 0
                ? 'bg-[#800080] text-white hover:bg-[#6a006a]'
                : 'bg-[#c9a0c9] text-white cursor-not-allowed'
              }`}
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
