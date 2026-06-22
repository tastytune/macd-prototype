import { Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

const ITV_TIERS = [
  { id: 'itv-75',  detail: '75+ channels',  price: 49.95  },
  { id: 'itv-150', detail: '150+ channels', price: 79.95  },
  { id: 'itv-250', detail: '250+ channels', price: 109.95 },
];

const TV_ADDONS = [
  { id: 'tv-hbo',      name: 'HBO',      price: 14.99, src: '/hbo.png'      },
  { id: 'tv-cinemax',  name: 'Cinemax',  price: 12.99, src: '/cinemax.png'  },
  { id: 'tv-fanatic',  name: 'FANatic',  price: 5.99,  src: '/fanatic.png'  },
  { id: 'tv-showtime', name: 'Showtime', price: 10.99, src: '/showtime.png' },
  { id: 'tv-starz',    name: 'STARZ',    price: 8.99,  src: '/starz.png'    },
];

const M04_OFFERS = [
  { id: 'm04-1gig', name: 'Internet 1 Gig', channels: '75+',  price: 49.95,  technology: 'Fiber' },
  { id: 'm04-2gig', name: 'Internet 2 Gig', channels: '250+', price: 109.95, technology: 'Fiber' },
];

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
  const isM04 = scenario === 'M04';
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

  const [selectedM04Offer, setSelectedM04Offer] = useState<string | null>(null);
  const [selectedITVTier, setSelectedITVTier] = useState<string | null>(null);
  const [selectedTVAddons, setSelectedTVAddons] = useState<Set<string>>(new Set());
  const [phoneBundleActive, setPhoneBundleActive] = useState(true);
  const currentMRC_M04 = SERVICES.reduce((s, svc) => s + svc.price, 0);
  const selectedOffer = M04_OFFERS.find(o => o.id === selectedM04Offer);
  const phoneBundlePrice = SERVICES.find(s => s.id === 'phone-bundle')?.price ?? 0;
  const selectedITVTierData = ITV_TIERS.find(t => t.id === selectedITVTier);
  const selectedAddonsData = TV_ADDONS.filter(a => selectedTVAddons.has(a.id));
  const addonsTotal = selectedAddonsData.reduce((s, a) => s + a.price, 0);
  const newMRC_M04 = selectedOffer
    ? selectedOffer.price
      + (phoneBundleActive ? phoneBundlePrice : 0)
      + (selectedITVTierData?.price ?? 0)
      + addonsTotal
    : null;

  const toggleTVAddon = (id: string) => {
    setSelectedTVAddons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  /* ── M04: Offer migration UI ── */
  if (isM04) {
    const offerDiff = newMRC_M04 !== null ? newMRC_M04 - currentMRC_M04 : null;
    return (
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
          <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
        </div>

        <div className="flex gap-6 items-start">

          {/* Left: current services + offer replacement cards */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Services to move</h2>

              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current services</p>
              <div className="flex flex-col gap-2">
                {SERVICES.map(svc => {
                  const isReplacing = selectedM04Offer !== null && svc.id === 'internet-200m';
                  const hasOffers = svc.id === 'internet-200m';
                  const isPhoneBundle = svc.id === 'phone-bundle';
                  const isPhoneExcluded = isPhoneBundle && !phoneBundleActive;
                  return (
                    <div key={svc.id} className="flex flex-col gap-2">
                      {/* Current service row */}
                      <div
                        onClick={
                          isPhoneBundle ? () => setPhoneBundleActive(p => !p)
                          : isReplacing ? () => setSelectedM04Offer(null)
                          : undefined
                        }
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all
                          ${isPhoneBundle || isReplacing ? 'cursor-pointer' : ''}
                          ${isReplacing
                            ? 'border-amber-300 bg-amber-50'
                            : isPhoneExcluded
                              ? 'border-gray-200 bg-gray-50 opacity-60'
                              : 'border-[#800080] bg-[#faf0fa]'
                          }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-all
                          ${isReplacing ? 'border-amber-400' : isPhoneExcluded ? 'border-gray-300' : 'border-[#800080]'}`}
                          style={{ width: 18, height: 18 }}>
                          {!isReplacing && !isPhoneExcluded && <div className="w-2 h-2 rounded-full bg-[#800080]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 ${isPhoneExcluded ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{svc.name}</p>
                          <p className="text-xs text-gray-500">{svc.detail}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <p className={`text-sm font-medium ${isPhoneExcluded ? 'text-gray-400' : 'text-gray-700'}`}>${svc.price.toFixed(2)}/mo</p>
                          {isReplacing ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Replacing</span>
                          ) : isPhoneExcluded ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Not moving</span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                          )}
                        </div>
                      </div>

                      {/* Replacement offers nested below internet-200m */}
                      {hasOffers && M04_OFFERS.map(offer => {

                        const isChecked = selectedM04Offer === offer.id;
                        return (
                          <button
                            key={offer.id}
                            onClick={() => setSelectedM04Offer(isChecked ? null : offer.id)}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full ml-6
                              ${isChecked ? 'border-[#800080] bg-[#faf0fa]' : 'border-[#d9a0d9] bg-white hover:border-[#800080]'}`}
                          >
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2
                              ${isChecked ? 'border-[#800080] bg-white' : 'border-gray-300 bg-white'}`}>
                              {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#800080]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{offer.name}</p>
                                  <p className="text-xs text-gray-500">{offer.technology} · {offer.channels} channels</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-4">
                                  <p className="text-sm font-medium text-gray-700">${offer.price.toFixed(2)}/mo</p>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                                    Offer migration
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                    </div>
                  );
                })}

                {/* iTV family + TV add-ons — visible when internet offer is selected */}
                {selectedM04Offer && (
                  <>
                    {/* iTV tiers */}
                    <div className="flex flex-col gap-2 mt-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Television</p>
                      {ITV_TIERS.map(tier => {
                        const isChecked = selectedITVTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            onClick={() => setSelectedITVTier(isChecked ? null : tier.id)}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full ml-6
                              ${isChecked ? 'border-[#800080] bg-[#faf0fa]' : 'border-[#d9a0d9] bg-white hover:border-[#800080]'}`}
                          >
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2
                              ${isChecked ? 'border-[#800080] bg-white' : 'border-gray-300 bg-white'}`}>
                              {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#800080]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{tier.detail}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-4">
                              <p className="text-sm font-medium text-gray-700">${tier.price.toFixed(2)}/mo</p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                                Offer migration
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* TV Add-ons grid */}
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-4 mb-3">TV Add-ons</p>
                    <div className="flex flex-wrap gap-4">
                      {TV_ADDONS.map(addon => {
                        const isChecked = selectedTVAddons.has(addon.id);
                        return (
                          <button
                            key={addon.id}
                            onClick={() => toggleTVAddon(addon.id)}
                            className="flex flex-col items-center gap-2 text-center"
                          >
                            <div className={`w-28 h-28 rounded-2xl border-4 overflow-hidden transition-all
                              ${isChecked ? 'border-[#800080] shadow-md' : 'border-transparent hover:border-[#d9a0d9]'}`}>
                              <img src={addon.src} alt={addon.name} className="w-full h-full object-cover" />
                            </div>
                            {isChecked ? (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{addon.name}</span>
                            ) : (
                              <span className="text-xs font-medium text-gray-700">{addon.name}</span>
                            )}
                            <span className="text-xs font-semibold text-[#800080]">${addon.price.toFixed(2)}/mo</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onBack}
                className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button
                onClick={() => selectedM04Offer && onNext([
                  selectedM04Offer,
                  ...(phoneBundleActive ? ['phone-bundle'] : []),
                  ...(selectedITVTier ? [selectedITVTier] : []),
                  ...selectedTVAddons,
                ])}
                disabled={!selectedM04Offer}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
                  ${selectedM04Offer ? 'bg-[#800080] text-white hover:bg-[#6a006a]' : 'bg-[#c9a0c9] text-white cursor-not-allowed'}`}>
                Next
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>

                <div className="pb-4 mb-4 border-b border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current MRC</span>
                    <span className="text-gray-700">${currentMRC_M04.toFixed(2)}</span>
                  </div>
                  {SERVICES.map(svc => {
                    const isExcluded = svc.id === 'phone-bundle' && !phoneBundleActive;
                    return (
                      <div key={svc.id} className={`flex justify-between text-sm pl-2 ${isExcluded ? 'opacity-50' : ''}`}>
                        <span className={`${isExcluded ? 'line-through text-gray-400' : 'text-gray-400'}`}>{svc.summaryLabel}</span>
                        <span className={`${isExcluded ? 'line-through text-gray-400' : 'text-gray-500'}`}>${svc.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">New MRC</span>
                    <span className={`font-medium ${newMRC_M04 !== null ? 'text-gray-900' : 'text-gray-400'}`}>
                      {newMRC_M04 !== null ? `$${newMRC_M04.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  {selectedOffer && (
                    <div className="flex justify-between text-sm pl-2">
                      <span className="text-gray-400">{selectedOffer.name}</span>
                      <span className="text-gray-500">${selectedOffer.price.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOffer && phoneBundleActive && (
                    <div className="flex justify-between text-sm pl-2">
                      <span className="text-gray-400">Phone Bundle</span>
                      <span className="text-gray-500">${phoneBundlePrice.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedITVTierData && (
                    <div className="flex justify-between text-sm pl-2">
                      <span className="text-gray-400">iTV {selectedITVTierData.detail}</span>
                      <span className="text-gray-500">${selectedITVTierData.price.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedAddonsData.map(addon => (
                    <div key={addon.id} className="flex justify-between text-sm pl-2">
                      <span className="text-gray-400">{addon.name}</span>
                      <span className="text-gray-500">${addon.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difference</span>
                    <span className={`font-semibold ${
                      offerDiff === null ? 'text-gray-400'
                      : offerDiff < 0 ? 'text-red-600'
                      : offerDiff > 0 ? 'text-green-600'
                      : 'text-gray-500'
                    }`}>
                      {offerDiff === null ? '—'
                        : offerDiff === 0 ? '$0.00'
                        : offerDiff > 0 ? `+$${offerDiff.toFixed(2)}`
                        : `-$${Math.abs(offerDiff).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-700 leading-snug">Price lock does not continue — clock resets.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
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
