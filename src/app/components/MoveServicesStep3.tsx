import { Lock } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

interface MoveServicesStep3Props {
  scenario: string;
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: (serviceIds: string[]) => void;
}

interface MoveServiceItem {
  id: string;
  name: string;
  detail: string;
  price: number;
  summaryLabel: string;
}

const SA_SERVICES: Record<string, MoveServiceItem[]> = {
  'sa-00912': [
    { id: 'internet', name: 'Internet 2Gig',  detail: 'Symmetric · Bundle primary · Price lock 14 mo.', price: 124.95, summaryLabel: 'Internet 2Gig' },
    { id: 'itv',      name: 'iTV Premium',    detail: 'TV 150+ Channels · Bundle component',            price: 79.95,  summaryLabel: 'iTV Premium'    },
    { id: 'cinemax',  name: 'Cinemax',        detail: 'TV add-on · Bundle component',                   price: 12.99,  summaryLabel: 'Cinemax'        },
    { id: 'fanatic',  name: 'FANatic',        detail: 'TV add-on · Bundle component',                   price: 5.99,   summaryLabel: 'FANatic'        },
  ],
  'sa-01047': [
    { id: 'internet-200m', name: 'Internet 200M', detail: 'Coax (HFC) · Bundle primary',  price: 69.95, summaryLabel: 'Internet 200M' },
    { id: 'phone-bundle',  name: 'Phone Bundle',  detail: 'Voice · Bundle component',     price: 29.95, summaryLabel: 'Phone Bundle'  },
  ],
};

const DEFAULT_SERVICES = SA_SERVICES['sa-00912'];

const COAX_OPTIONS: MoveServiceItem[] = [
  { id: 'internet-coax-200', name: 'Internet 200 Mbps', detail: 'Coax (HFC) · Max speed available at destination', price: 79.95,  summaryLabel: 'Internet 200 Mbps' },
  { id: 'internet-coax-1g',  name: 'Internet 1 Gig',   detail: 'Coax (HFC) · Best available speed at destination',  price: 99.95,  summaryLabel: 'Internet 1 Gig'    },
];

const INTERNET_COAX = COAX_OPTIONS[0];

export function MoveServicesStep3({ scenario, selectedSA, onBack, onNext }: MoveServicesStep3Props) {
  const isM03 = scenario === 'M03';
  const SERVICES = SA_SERVICES[selectedSA?.id ?? ''] ?? DEFAULT_SERVICES;
  const isFiberSA = !selectedSA?.id || selectedSA.id === 'sa-00912';

  const initialSelected = new Set(
    isM03 && isFiberSA
      ? ['internet-coax-200', 'itv', 'cinemax', 'fanatic']
      : SERVICES.map(s => s.id)
  );
  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  const effectiveServices = isM03 && isFiberSA
    ? [...COAX_OPTIONS, ...SERVICES.filter(s => s.id !== 'internet')]
    : SERVICES;

  const COAX_IDS = new Set(COAX_OPTIONS.map(o => o.id));
  const TV_IDS = ['itv', 'cinemax', 'fanatic'];
  const tvEnabled = !isM03 || !isFiberSA || selected.has('internet-coax-1g');

  const toggleCoax = (id: string) => {
    const next = new Set(selected);
    COAX_IDS.forEach(c => next.delete(c));
    next.add(id);
    // deselect TV services when switching to 200 Mbps
    if (id === 'internet-coax-200') {
      TV_IDS.forEach(tv => next.delete(tv));
    }
    setSelected(next);
  };

  const currentMRC = SERVICES.reduce((sum, s) => sum + s.price, 0);
  const newMRC = effectiveServices.filter(s => selected.has(s.id)).reduce((sum, s) => sum + s.price, 0);
  const diff = newMRC - currentMRC;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
        <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Services to move</h2>

        <div className="flex gap-8">

          {/* Left: service cards */}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current services</p>
            <div className="flex flex-col gap-3">
              {/* M03: Internet 2Gig disabled + Coax replacement (fiber SAs only) */}
              {isM03 && isFiberSA && (
                <div className="flex flex-col gap-2">
                  {/* Disabled 2Gig */}
                  <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 bg-white" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-400 line-through">Internet 2Gig</p>
                        <p className="text-sm font-medium text-gray-400 ml-4 flex-shrink-0 line-through">$124.95/mo</p>
                      </div>
                      <p className="text-xs text-gray-400 line-through">Symmetric · Bundle primary · Price lock 14 mo.</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-500">
                          Not available at destination
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Coax replacement options — mutually exclusive */}
                  {COAX_OPTIONS.map(opt => {
                    const isChecked = selected.has(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleCoax(opt.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full ml-4
                          ${isChecked ? 'border-orange-400 bg-orange-50' : 'border-orange-200 bg-white hover:border-orange-300'}`}
                      >
                        {/* Radio dot */}
                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2
                          ${isChecked ? 'border-orange-500 bg-white' : 'border-gray-300 bg-white'}`}>
                          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">{opt.name}</p>
                            <p className="text-sm font-medium text-gray-700 ml-4 flex-shrink-0">${opt.price.toFixed(2)}/mo</p>
                          </div>
                          <p className="text-xs text-gray-500">{opt.detail}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              Coax replacement
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Regular services (non-internet, or all when not M03) */}
              {effectiveServices.filter(s => !COAX_IDS.has(s.id)).map(svc => {
                const isTV = TV_IDS.includes(svc.id) && isFiberSA;
                const isDisabled = isTV && !tvEnabled;
                const isChecked = selected.has(svc.id) && !isDisabled;
                return (
                  <button
                    key={svc.id}
                    onClick={() => !isDisabled && toggle(svc.id)}
                    disabled={isDisabled}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full
                      ${isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                        : isChecked
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center
                      ${isChecked && !isDisabled ? 'bg-blue-600 border-2 border-blue-600' : 'border-2 border-gray-300 bg-white'}`}>
                      {isChecked && !isDisabled && (
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
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3e8f3] text-[#800080]">
                          → Move
                        </span>
                        {svc.id === 'internet' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                            Price Lock
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: price summary */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>

                <div className="pb-4 mb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Current monthly charges</span>
                    <span className="text-gray-900">${currentMRC.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {effectiveServices.map(svc => (
                    <div key={svc.id} className={`flex justify-between text-sm ${!selected.has(svc.id) ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-gray-500">{svc.summaryLabel}</span>
                      <span className="text-gray-700">${svc.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">New MRC</span>
                    <span className="text-xl font-medium text-gray-900">${newMRC.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difference</span>
                    <span className={`font-semibold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {diff === 0 ? '$0.00' : diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <Lock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-blue-600 leading-snug">Price lock continues — clock does not reset.</span>
                </div>
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
