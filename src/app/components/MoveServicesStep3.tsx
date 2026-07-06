import { Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

const ITV_TIERS = [
  { id: 'itv-75',  label: '75+',  name: 'iTV Essentials', unit: 'channels', price: 49.95  },
  { id: 'itv-150', label: '150+', name: 'iTV Preferred',  unit: 'channels', price: 79.95  },
  { id: 'itv-250', label: '250+', name: 'iTV Extra',      unit: 'channels', price: 109.95 },
];

const TV_ADDONS = [
  { id: 'tv-hbo',      name: 'HBO',      price: 14.99, src: '/hbo.png'      },
  { id: 'tv-cinemax',  name: 'Cinemax',  price: 12.99, src: '/cinemax.png'  },
  { id: 'tv-fanatic',  name: 'FANatic',  price: 5.99,  src: '/fanatic.png'  },
  { id: 'tv-showtime', name: 'Showtime', price: 10.99, src: '/showtime.png' },
  { id: 'tv-starz',    name: 'STARZ',    price: 8.99,  src: '/starz.png'    },
];

const M04_OFFERS = [
  { id: 'm04-1gig', speed: '1', unit: 'Gbps',  price: 49.95,  technology: 'Fiber' },
  { id: 'm04-2gig', speed: '2', unit: 'Gbps',  price: 109.95, technology: 'Fiber' },
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
    { id: 'internet', name: 'Internet 2Gbps',  detail: 'Symmetric · Bundle primary · Price lock 14 mo.', price: 124.95, summaryLabel: 'Internet 2Gbps' },
    { id: 'itv',      name: 'iTV Preferred',  detail: 'TV 150+ Channels · Bundle component',            price: 79.95,  summaryLabel: 'iTV Preferred'  },
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
  { id: 'internet-coax-200', name: 'Internet 200 Mbps', detail: 'Coax (HFC) · Max speed available at destination',  price: 79.95,  summaryLabel: 'Internet 200 Mbps' },
  { id: 'internet-coax-1g',  name: 'Internet 1 Gbps',   detail: 'Coax (HFC) · Best available speed at destination', price: 99.95,  summaryLabel: 'Internet 1 Gbps'    },
];

const FIBER_OPTIONS: MoveServiceItem[] = [
  { id: 'internet-fiber-1g', name: 'Internet 1 Gbps',  detail: 'Fiber · Symmetric · Available at destination',      price: 99.95,  summaryLabel: 'Internet 1 Gbps'  },
  { id: 'internet-fiber-2g', name: 'Internet 2 Gbps',  detail: 'Fiber · Symmetric · Best speed at destination',     price: 124.95, summaryLabel: 'Internet 2 Gbps'  },
];

const TV_IDS = ['itv', 'cinemax', 'fanatic'];
const COAX_IDS  = new Set(COAX_OPTIONS.map(o => o.id));
const FIBER_IDS = new Set(FIBER_OPTIONS.map(o => o.id));

/* ── Shared card button ── */
function PlanButton({ isSelected, isCurrent, label = 'Select', selectedLabel = 'Selected', currentLabel = 'Your Current Plan', theme = 'purple' }: {
  isSelected?: boolean; isCurrent?: boolean; label?: string; selectedLabel?: string; currentLabel?: string; theme?: 'purple' | 'orange';
}) {
  if (isCurrent) {
    return (
      <div className="w-full py-1.5 rounded-[10px] bg-gray-100 text-sm font-semibold text-gray-400 uppercase tracking-wide cursor-default">
        {currentLabel}
      </div>
    );
  }
  const bg = theme === 'orange'
    ? (isSelected ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600')
    : (isSelected ? 'bg-[#800080]' : 'bg-[#800080] hover:bg-[#6a006a]');
  return (
    <div className={`w-full py-1.5 rounded-[10px] text-sm font-bold uppercase tracking-wide transition-colors text-white ${bg}`}>
      {isSelected ? selectedLabel : label}
    </div>
  );
}

export function MoveServicesStep3({ scenario, selectedSA, onBack, onNext }: MoveServicesStep3Props) {
  const isM03 = scenario === 'M03';
  const isM04 = scenario === 'M04';
  const SERVICES = SA_SERVICES[selectedSA?.id ?? ''] ?? DEFAULT_SERVICES;
  const isFiberSA = !selectedSA?.id || selectedSA.id === 'sa-00912';

  const initialSelected = new Set(
    isM03 && isFiberSA  ? ['internet-coax-200', 'itv', 'cinemax', 'fanatic']
    : isM03 && !isFiberSA ? SERVICES.filter(s => s.id !== 'internet-200m').map(s => s.id)
    : SERVICES.map(s => s.id)
  );
  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  const effectiveServices = isM03 && isFiberSA
    ? [...COAX_OPTIONS, ...SERVICES.filter(s => s.id !== 'internet')]
    : isM03 && !isFiberSA
      ? [...FIBER_OPTIONS, ...SERVICES.filter(s => s.id !== 'internet-200m')]
      : SERVICES;

  const tvEnabled = !isM03 || !isFiberSA || selected.has('internet-coax-1g');

  const toggleCoax = (id: string) => {
    const next = new Set(selected);
    COAX_IDS.forEach(c => next.delete(c));
    next.add(id);
    if (id === 'internet-coax-200') TV_IDS.forEach(tv => next.delete(tv));
    setSelected(next);
  };

  const toggleFiber = (id: string) => {
    const next = new Set(selected);
    FIBER_IDS.forEach(c => next.delete(c));
    next.add(id);
    setSelected(next);
  };

  const currentMRC = SERVICES.reduce((sum, s) => sum + s.price, 0);
  const newMRC = effectiveServices.filter(s => selected.has(s.id)).reduce((sum, s) => sum + s.price, 0);
  const diff = newMRC - currentMRC;

  const [selectedM04Offer, setSelectedM04Offer] = useState<string | null>(null);
  const [selectedITVTier, setSelectedITVTier] = useState<string | null>(null);
  const [selectedTVAddons, setSelectedTVAddons] = useState<Set<string>>(new Set());
  const [selectedM03ITVTier, setSelectedM03ITVTier] = useState<string | null>(null);
  const [selectedM03TVAddons, setSelectedM03TVAddons] = useState<Set<string>>(new Set());
  const [phoneBundleActive, setPhoneBundleActive] = useState(true);
  const currentMRC_M04 = SERVICES.reduce((s, svc) => s + svc.price, 0);
  const selectedOffer = M04_OFFERS.find(o => o.id === selectedM04Offer);
  const phoneBundleService = SERVICES.find(s => s.id === 'phone-bundle');
  const phoneBundlePrice = phoneBundleService?.price ?? 0;
  const selectedITVTierData = ITV_TIERS.find(t => t.id === selectedITVTier);
  const selectedAddonsData = TV_ADDONS.filter(a => selectedTVAddons.has(a.id));
  const addonsTotal = selectedAddonsData.reduce((s, a) => s + a.price, 0);
  const newMRC_M04 = selectedOffer
    ? selectedOffer.price + (phoneBundleActive ? phoneBundlePrice : 0) + (selectedITVTierData?.price ?? 0) + addonsTotal
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
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  /* ── Shared order summary sidebar ── */
  const M04Sidebar = () => {
    const offerDiff = newMRC_M04 !== null ? newMRC_M04 - currentMRC_M04 : null;
    return (
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
                    <span className={isExcluded ? 'line-through text-gray-400' : 'text-gray-400'}>{svc.summaryLabel}</span>
                    <span className={isExcluded ? 'line-through text-gray-400' : 'text-gray-500'}>${svc.price.toFixed(2)}</span>
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
                  <span className="text-gray-400">{selectedOffer.speed} Gbps Internet</span>
                  <span className="text-gray-500">${selectedOffer.price.toFixed(2)}</span>
                </div>
              )}
              {selectedOffer && phoneBundleActive && phoneBundleService && (
                <div className="flex justify-between text-sm pl-2">
                  <span className="text-gray-400">Phone Bundle</span>
                  <span className="text-gray-500">${phoneBundlePrice.toFixed(2)}</span>
                </div>
              )}
              {selectedITVTierData && (
                <div className="flex justify-between text-sm pl-2">
                  <span className="text-gray-400">{selectedITVTierData.name}</span>
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
    );
  };

  /* ── M04: Offer migration UI ── */
  if (isM04) {
    const currentInternetSvc = SERVICES.find(s => s.id === 'internet-200m');
    const isReplacing = selectedM04Offer !== null;

    return (
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
          <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
        </div>
        <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={2} />

        <div className="flex gap-6 items-start">

          {/* Left: plan cards */}
          <div className="flex-1 min-w-0">

            {/* Internet plan cards */}
            <div className="grid grid-cols-3 gap-4 mb-6 items-stretch">

              {/* Current: Internet 200M */}
              <div
                onClick={isReplacing ? () => setSelectedM04Offer(null) : undefined}
                className={`rounded-2xl border-2 p-6 text-center flex flex-col transition-all
                  ${isReplacing ? 'border-amber-300 bg-amber-50 cursor-pointer' : 'border-gray-200 bg-gray-50 cursor-default'}`}
              >
                <div className="flex justify-center mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border
                    ${isReplacing ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                    {isReplacing ? 'Replacing' : 'Active'}
                  </span>
                </div>
                <div className={`text-5xl font-black mb-1 ${isReplacing ? 'text-amber-300' : 'text-gray-300'}`}>200</div>
                <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isReplacing ? 'text-amber-400' : 'text-gray-400'}`}>Mbps</div>
                <div className={`text-2xl font-bold mb-1 ${isReplacing ? 'text-amber-600' : 'text-gray-400'}`}>
                  ${(currentInternetSvc?.price ?? 69.95).toFixed(2)}
                  <span className="text-sm font-normal text-gray-400"> /month</span>
                </div>
                <div className="mt-auto pt-6">
                  <p className="text-xs text-gray-400 mb-2">Select another plan to replace</p>
                  <PlanButton isCurrent />
                </div>
              </div>

              {/* M04 offer cards */}
              {M04_OFFERS.map(offer => {
                const isSelected = selectedM04Offer === offer.id;
                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedM04Offer(isSelected ? null : offer.id)}
                    className={`rounded-2xl border-2 p-6 text-center flex flex-col cursor-pointer transition-all
                      ${isSelected
                        ? 'border-[#800080] bg-[#faf0fa]'
                        : 'border-gray-200 bg-white hover:border-[#d9a0d9] hover:bg-[#faf0fa]/40'}`}
                  >

                    <div className={`text-5xl font-black mb-1 ${isSelected ? 'text-[#800080]' : 'text-gray-900'}`}>{offer.speed}</div>
                    <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isSelected ? 'text-[#800080]' : 'text-gray-500'}`}>{offer.unit}</div>
                    <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-[#600060]' : 'text-gray-900'}`}>
                      ${offer.price.toFixed(2)}
                      <span className="text-sm font-normal text-gray-400"> /month</span>
                    </div>
                    <div className="mt-auto pt-6">
                      <PlanButton isSelected={isSelected} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phone Bundle toggle row */}
            {phoneBundleService && (
              <div
                onClick={() => setPhoneBundleActive(p => !p)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all mb-6
                  ${phoneBundleActive
                    ? 'border-[#800080] bg-[#faf0fa]'
                    : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${phoneBundleActive ? 'border-[#800080]' : 'border-gray-300'}`}>
                    {phoneBundleActive && <div className="w-2.5 h-2.5 rounded-full bg-[#800080]" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${phoneBundleActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                      Phone Bundle
                    </p>
                    <p className="text-xs text-gray-500">{phoneBundleService.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-medium ${phoneBundleActive ? 'text-gray-700' : 'text-gray-400'}`}>
                    ${phoneBundleService.price.toFixed(2)}/mo
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                    ${phoneBundleActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {phoneBundleActive ? 'Moving' : 'Not moving'}
                  </span>
                </div>
              </div>
            )}

            {/* iTV tiers + TV Add-ons — visible when internet offer is selected */}
            {selectedM04Offer && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Television</p>
                <div className="grid grid-cols-3 gap-4 mb-6 items-stretch">
                  {ITV_TIERS.map(tier => {
                    const isChecked = selectedITVTier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedITVTier(isChecked ? null : tier.id)}
                        className={`rounded-2xl border-2 p-6 text-center flex flex-col cursor-pointer transition-all
                          ${isChecked
                            ? 'border-[#800080] bg-[#faf0fa]'
                            : 'border-gray-200 bg-white hover:border-[#d9a0d9] hover:bg-[#faf0fa]/40'}`}
                      >
                        <div className="flex justify-center mb-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                            iTV
                          </span>
                        </div>
                        <div className={`text-4xl font-black mb-1 ${isChecked ? 'text-[#800080]' : 'text-gray-900'}`}>{tier.label}</div>
                        <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isChecked ? 'text-[#800080]' : 'text-gray-500'}`}>{tier.unit}</div>
                        <div className={`text-xl font-bold mb-1 ${isChecked ? 'text-[#600060]' : 'text-gray-900'}`}>
                          ${tier.price.toFixed(2)}
                          <span className="text-sm font-normal text-gray-400"> /month</span>
                        </div>
                        <div className="mt-auto pt-6">
                          <PlanButton isSelected={isChecked} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">TV Add-ons</p>
                <div className="flex flex-wrap gap-4 mb-6">
                  {TV_ADDONS.map(addon => {
                    const isChecked = selectedTVAddons.has(addon.id);
                    return (
                      <button key={addon.id} onClick={() => toggleTVAddon(addon.id)} className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-28 h-28 rounded-2xl border-4 overflow-hidden transition-all
                          ${isChecked ? 'border-[#800080] shadow-md' : 'border-transparent hover:border-[#d9a0d9]'}`}>
                          <img src={addon.src} alt={addon.name} className="w-full h-full object-cover" />
                        </div>
                        {isChecked
                          ? <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{addon.name}</span>
                          : <span className="text-xs font-medium text-gray-700">{addon.name}</span>
                        }
                        <span className="text-xs font-semibold text-[#800080]">${addon.price.toFixed(2)}/mo</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

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

          <M04Sidebar />
        </div>
      </div>
    );
  }

  /* ── M03: Technology change (Fiber ↔ Coax) ── */
  if (isM03) {
    const replacementOptions = isFiberSA ? COAX_OPTIONS : FIBER_OPTIONS;
    const replacementIDs     = isFiberSA ? COAX_IDS     : FIBER_IDS;
    const toggleReplacement  = isFiberSA ? toggleCoax    : toggleFiber;
    const technologyLabel    = isFiberSA ? 'Fiber → Coax. Speed and features may vary.' : 'Coax → Fiber. Symmetric speeds available.';
    const alertTheme         = isFiberSA ? 'orange' : 'indigo';

    const currentInternetSvc = isFiberSA
      ? SERVICES.find(s => s.id === 'internet')
      : SERVICES.find(s => s.id === 'internet-200m');
    const currentSpeed = isFiberSA ? '2' : '200';
    const currentUnit  = isFiberSA ? 'Gbps' : 'Mbps';
    const currentPrice = currentInternetSvc?.price ?? (isFiberSA ? 124.95 : 69.95);
    const notAvailableLabel = isFiberSA ? 'Not available at destination' : 'Being replaced by Fiber';
    const replacementBadge  = isFiberSA ? 'Coax replacement' : 'Fiber upgrade';
    const cardTheme         = isFiberSA ? 'orange' : 'indigo';

    const nonInternetServices = SERVICES.filter(s => s.id !== 'internet' && s.id !== 'internet-200m');
    // For fiber SA: TV is handled via iTV cards/add-ons, not toggle rows
    const otherServices = isFiberSA
      ? nonInternetServices.filter(s => !TV_IDS.includes(s.id))
      : nonInternetServices;

    const selectedM03ITV      = ITV_TIERS.find(t => t.id === selectedM03ITVTier);
    const selectedM03AddonsData = TV_ADDONS.filter(a => selectedM03TVAddons.has(a.id));
    const m03AddonsTotal = selectedM03AddonsData.reduce((s, a) => s + a.price, 0);

    const m03CurrentMRC = SERVICES.reduce((s, svc) => s + svc.price, 0);
    const m03CoaxOrFiberPrice = replacementOptions.find(o => selected.has(o.id))?.price ?? 0;
    const m03OtherServicesTotal = otherServices.filter(s => selected.has(s.id)).reduce((s, svc) => s + svc.price, 0);
    const m03NewMRC = m03CoaxOrFiberPrice + m03OtherServicesTotal
      + (isFiberSA ? (selectedM03ITV?.price ?? 0) + m03AddonsTotal : 0);
    const m03Diff = m03NewMRC - m03CurrentMRC;

    const selectedReplacement = replacementOptions.find(o => selected.has(o.id));

    /* card color helpers */
    const selBorder  = cardTheme === 'orange' ? 'border-orange-400'          : 'border-indigo-400';
    const selBg      = cardTheme === 'orange' ? 'bg-orange-50'               : 'bg-indigo-50';
    const hovBorder  = cardTheme === 'orange' ? 'hover:border-orange-300'    : 'hover:border-indigo-300';
    const hovBg      = cardTheme === 'orange' ? 'hover:bg-orange-50/40'      : 'hover:bg-indigo-50/40';
    const badgeSel   = cardTheme === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-300'  : 'bg-indigo-100 text-indigo-700 border-indigo-300';
    const badgeIdle  = cardTheme === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-200'   : 'bg-indigo-50 text-indigo-600 border-indigo-200';
    const numSel     = cardTheme === 'orange' ? 'text-orange-600'            : 'text-indigo-600';
    const unitSel    = cardTheme === 'orange' ? 'text-orange-500'            : 'text-indigo-500';
    const priceSel   = cardTheme === 'orange' ? 'text-orange-700'            : 'text-indigo-700';

    return (
      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
          <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
        </div>
        <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={2} />

        <div className="flex gap-6 items-start">

          {/* Left: plan cards */}
          <div className="flex-1 min-w-0">

            {/* Internet cards */}
            <div className="grid grid-cols-3 gap-4 mb-6 items-stretch">

              {/* Current internet — disabled */}
              <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 text-center flex flex-col opacity-50 cursor-not-allowed">
                <div className="flex justify-center mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Active</span>
                </div>
                <div className="text-5xl font-black mb-1 text-gray-300">{currentSpeed}</div>
                <div className="text-sm font-semibold uppercase tracking-widest mb-5 text-gray-400">{currentUnit}</div>
                <div className="text-2xl font-bold mb-1 text-gray-400">
                  ${currentPrice.toFixed(2)}
                  <span className="text-sm font-normal text-gray-400"> /month</span>
                </div>
                <div className="mt-auto pt-6">
                  <p className="text-xs text-gray-400 mb-2">{notAvailableLabel}</p>
                  <div className="w-full py-1.5 rounded-[10px] bg-gray-100 text-sm font-semibold text-gray-400 uppercase tracking-wide cursor-not-allowed">
                    Not Available
                  </div>
                </div>
              </div>

              {/* Replacement options */}
              {replacementOptions.map(opt => {
                const isSelected = selected.has(opt.id);
                const speedVal = opt.id.includes('200') ? '200' : opt.id.includes('1g') ? '1' : '2';
                const unitVal  = opt.id.includes('200') ? 'Mbps' : 'Gbps';
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleReplacement(opt.id)}
                    className={`rounded-2xl border-2 p-6 text-center flex flex-col cursor-pointer transition-all
                      ${isSelected ? `${selBorder} ${selBg}` : `border-gray-200 bg-white ${hovBorder} ${hovBg}`}`}
                  >
                    <div className="flex justify-center mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isSelected ? badgeSel : badgeIdle}`}>
                        {replacementBadge}
                      </span>
                    </div>
                    <div className={`text-5xl font-black mb-1 ${isSelected ? numSel : 'text-gray-900'}`}>{speedVal}</div>
                    <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isSelected ? unitSel : 'text-gray-500'}`}>{unitVal}</div>
                    <div className={`text-2xl font-bold mb-1 ${isSelected ? priceSel : 'text-gray-900'}`}>
                      ${opt.price.toFixed(2)}
                      <span className="text-sm font-normal text-gray-400"> /month</span>
                    </div>
                    <div className="mt-auto pt-6">
                      <PlanButton isSelected={isSelected} theme={cardTheme === 'orange' ? 'orange' : 'purple'} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* iTV tier cards + TV Add-ons — fiber SA only */}
            {isFiberSA && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Television</p>
                <div className={`grid grid-cols-3 gap-4 mb-6 items-stretch transition-opacity ${!tvEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  {ITV_TIERS.map(tier => {
                    const isChecked = selectedM03ITVTier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => tvEnabled && setSelectedM03ITVTier(isChecked ? null : tier.id)}
                        className={`rounded-2xl border-2 p-6 text-center flex flex-col cursor-pointer transition-all
                          ${isChecked
                            ? 'border-[#800080] bg-[#faf0fa]'
                            : 'border-gray-200 bg-white hover:border-[#d9a0d9] hover:bg-[#faf0fa]/40'}`}
                      >
                        <div className="flex justify-center mb-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">{tier.name}</span>
                        </div>
                        <div className={`text-4xl font-black mb-1 ${isChecked ? 'text-[#800080]' : 'text-gray-900'}`}>{tier.label}</div>
                        <div className={`text-sm font-semibold uppercase tracking-widest mb-5 ${isChecked ? 'text-[#800080]' : 'text-gray-500'}`}>{tier.unit}</div>
                        <div className={`text-xl font-bold mb-1 ${isChecked ? 'text-[#600060]' : 'text-gray-900'}`}>
                          ${tier.price.toFixed(2)}
                          <span className="text-sm font-normal text-gray-400"> /month</span>
                        </div>
                        <div className="mt-auto pt-6">
                          <PlanButton isSelected={isChecked} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!tvEnabled && (
                  <p className="text-xs text-gray-400 mb-4">Television requires Internet 1 Gbps Coax.</p>
                )}

                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">TV Add-ons</p>
                <div className={`flex flex-wrap gap-4 mb-6 transition-opacity ${!tvEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  {TV_ADDONS.map(addon => {
                    const isChecked = selectedM03TVAddons.has(addon.id);
                    return (
                      <button key={addon.id} onClick={() => {
                        if (!tvEnabled) return;
                        setSelectedM03TVAddons(prev => {
                          const next = new Set(prev);
                          if (next.has(addon.id)) next.delete(addon.id); else next.add(addon.id);
                          return next;
                        });
                      }} className="flex flex-col items-center gap-2 text-center">
                        <div className={`w-28 h-28 rounded-2xl border-4 overflow-hidden transition-all
                          ${isChecked ? 'border-[#800080] shadow-md' : 'border-transparent hover:border-[#d9a0d9]'}`}>
                          <img src={addon.src} alt={addon.name} className="w-full h-full object-cover" />
                        </div>
                        {isChecked
                          ? <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{addon.name}</span>
                          : <span className="text-xs font-medium text-gray-700">{addon.name}</span>}
                        <span className="text-xs font-semibold text-[#800080]">${addon.price.toFixed(2)}/mo</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Other services (Phone Bundle for non-fiber SA) */}
            {otherServices.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Other services</p>
                <div className="flex flex-col gap-2 mb-6">
                  {otherServices.map(svc => {
                    const isChecked = selected.has(svc.id);
                    return (
                      <div
                        key={svc.id}
                        onClick={() => toggle(svc.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${isChecked ? 'border-[#800080] bg-[#faf0fa]' : 'border-gray-200 bg-white hover:border-[#d9a0d9]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${isChecked ? 'bg-[#800080] border-[#800080]' : 'border-gray-300 bg-white'}`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                            <p className="text-xs text-gray-500">{svc.detail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-medium text-gray-700">${svc.price.toFixed(2)}/mo</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isChecked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isChecked ? 'Moving' : 'Not moving'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onBack}
                className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button
                onClick={() => onNext([
                  ...selected,
                  ...(isFiberSA && selectedM03ITVTier ? [selectedM03ITVTier] : []),
                  ...(isFiberSA ? [...selectedM03TVAddons] : []),
                ])}
                disabled={selected.size === 0}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
                  ${selected.size > 0 ? 'bg-[#800080] text-white hover:bg-[#6a006a]' : 'bg-[#c9a0c9] text-white cursor-not-allowed'}`}>
                Next
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="pb-4 mb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Current MRC</span>
                    <span className="text-gray-900">${m03CurrentMRC.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {replacementOptions.map(opt => (
                    <div key={opt.id} className={`flex justify-between text-sm ${!selected.has(opt.id) ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-gray-500">{opt.summaryLabel}</span>
                      <span className="text-gray-700">${opt.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {isFiberSA && selectedM03ITV && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{selectedM03ITV.name}</span>
                      <span className="text-gray-700">${selectedM03ITV.price.toFixed(2)}</span>
                    </div>
                  )}
                  {isFiberSA && selectedM03AddonsData.map(a => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">{a.name}</span>
                      <span className="text-gray-700">${a.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {otherServices.map(svc => (
                    <div key={svc.id} className={`flex justify-between text-sm ${!selected.has(svc.id) ? 'opacity-40 line-through' : ''}`}>
                      <span className="text-gray-500">{svc.summaryLabel}</span>
                      <span className="text-gray-700">${svc.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">New MRC</span>
                    <span className="text-xl font-medium text-gray-900">${m03NewMRC.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difference</span>
                    <span className={`font-semibold ${m03Diff < 0 ? 'text-red-600' : m03Diff > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {m03Diff === 0 ? '$0.00' : m03Diff > 0 ? `+$${m03Diff.toFixed(2)}` : `-$${Math.abs(m03Diff).toFixed(2)}`}
                    </span>
                  </div>
                </div>
                {selectedReplacement && (
                  <div className={`mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg border
                    ${alertTheme === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${alertTheme === 'orange' ? 'text-orange-600' : 'text-indigo-600'}`} />
                    <span className={`text-xs leading-snug ${alertTheme === 'orange' ? 'text-orange-700' : 'text-indigo-700'}`}>
                      Technology change: {technologyLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ── M01 / M02 (and M03 non-fiber): standard list ── */
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
        <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={2} />

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Services to move</h2>

        <div className="flex gap-8">

          {/* Left: service cards */}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current services</p>
            <div className="flex flex-col gap-3">
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
          <button onClick={onBack}
            className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button
            onClick={() => onNext([...selected])}
            disabled={selected.size === 0}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
              ${selected.size > 0 ? 'bg-[#800080] text-white hover:bg-[#6a006a]' : 'bg-[#c9a0c9] text-white cursor-not-allowed'}`}>
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
