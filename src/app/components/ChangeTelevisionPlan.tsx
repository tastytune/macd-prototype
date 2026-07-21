import { useState } from 'react';
import { MapPin, AlertTriangle, Package, Info } from 'lucide-react';
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
  'sa-00912': ['75plus', '250plus'],
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

// ── Service Options ──────────────────────────────────────────────────────────
const VIDEO_STREAM_PRICE_PER = 1.00;  // per additional stream above the 3 included

const DVR_OPTIONS = [
  { hours: 50,  price: 0     },
  { hours: 100, price: 5.00  },
  { hours: 200, price: 10.00 },
  { hours: 300, price: 15.00 },
];

const SET_TOP_BOX_PRICE_PER = 4.95;  // per box + remote pair per month

// Current service-option values per SA
const SA_VIDEO_STREAMS: Record<string, number> = { 'sa-00912': 4, 'sa-01047': 3 };
const SA_DVR_HOURS:     Record<string, number> = { 'sa-00912': 100, 'sa-01047': 50 };
const SA_SET_TOP_BOXES: Record<string, number> = { 'sa-00912': 2, 'sa-01047': 0 };

// ── UI helpers ───────────────────────────────────────────────────────────────
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

function StepperButton({ onClick, disabled, children }: {
  onClick: () => void; disabled: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-full border-2 text-xl font-bold flex items-center justify-center transition-colors flex-shrink-0
        ${disabled
          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
          : 'border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100'}`}
    >
      {children}
    </button>
  );
}

export function ChangeTelevisionPlan({ selectedSA, selectedInternetPlanId, previousLines, isDowngrade, isUpgrade, isMove2 = false, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangeTelevisionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const saId = selectedSA?.id ?? '';
  const activeAddOnIds = SA_TV_ACTIVE_ADDONS[saId] ?? [];
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set(activeAddOnIds));

  // Service Options state
  const initStreams = SA_VIDEO_STREAMS[saId] ?? 3;
  const initDvr    = SA_DVR_HOURS[saId] ?? 50;
  const initBoxes  = SA_SET_TOP_BOXES[saId] ?? 0;
  const [videoStreams, setVideoStreams] = useState(initStreams);
  const [dvrHours,    setDvrHours]    = useState(initDvr);
  const [setTopBoxes, setSetTopBoxes]  = useState(initBoxes);
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);

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

  // Service Options derived
  const videoStreamPrice = Math.max(0, videoStreams - 3) * VIDEO_STREAM_PRICE_PER;
  const dvrPrice         = DVR_OPTIONS.find(o => o.hours === dvrHours)?.price ?? 0;
  const stbPrice         = setTopBoxes * SET_TOP_BOX_PRICE_PER;
  const stbDelta         = setTopBoxes - initBoxes;
  const serviceOptsChanged = videoStreams !== initStreams || dvrHours !== initDvr || setTopBoxes !== initBoxes;

  const canContinue = !!selectedPlan || addOnsChanged || serviceOptsChanged;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';
  const planLabel = activePlan ? activePlan.name : '';

  // Build service-option CartLines (only non-zero cost items)
  const buildServiceOptLines = (): CartLine[] => {
    const lines: CartLine[] = [];
    if (videoStreamPrice > 0)
      lines.push({ label: `Video Streams (${videoStreams})`, price: videoStreamPrice, group: 'television' });
    if (dvrPrice > 0)
      lines.push({ label: `DVR Storage (${dvrHours} hrs)`, price: dvrPrice, group: 'television' });
    if (stbPrice > 0)
      lines.push({ label: `Set-Top Boxes + Remotes (${setTopBoxes})`, price: stbPrice, group: 'television' });
    return lines;
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">{isMove2 ? 'Move Television Service' : 'Change Television Service'}</h1>
        <ContextBar action={isMove2 ? 'move2' : 'change'} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={isMove2
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={isMove2 ? 3 : 2}
      />

      <div className="flex gap-8 items-start">

        {/* ── Left: plan selection + options + add-ons ── */}
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
                    ) : selectedPlan ? (
                      <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5 mb-3 line-through">
                        Active
                      </span>
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

          {/* ── Service Options ── */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-base font-semibold text-gray-900">Service Options</h3>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-default" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50">
                  Adjust streams, DVR storage, and equipment for this account.
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                </div>
              </div>
            </div>

            <div className="space-y-4">

              {/* Video Streams */}
              <div className="flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-white">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Video Streams</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    3 included · +${VIDEO_STREAM_PRICE_PER.toFixed(2)}/stream/mo for additional
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StepperButton onClick={() => setVideoStreams(v => Math.max(3, v - 1))} disabled={videoStreams <= 3}>−</StepperButton>
                  <div className="text-center w-14">
                    <p className="text-2xl font-bold text-gray-900 leading-none">{videoStreams}</p>
                    {videoStreamPrice > 0
                      ? <p className="text-xs text-blue-600 font-semibold mt-0.5">+${videoStreamPrice.toFixed(2)}/mo</p>
                      : <p className="text-xs text-green-600 font-medium mt-0.5">Included</p>
                    }
                  </div>
                  <StepperButton onClick={() => setVideoStreams(v => Math.min(10, v + 1))} disabled={videoStreams >= 10}>+</StepperButton>
                </div>
              </div>

              {/* DVR Storage */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">DVR Storage</p>
                  </div>
                  {dvrPrice > 0
                    ? <span className="text-sm font-semibold text-blue-600">+${dvrPrice.toFixed(2)}/mo</span>
                    : <span className="text-sm font-semibold text-green-600">Included</span>
                  }
                </div>
                <div className="flex gap-2">
                  {DVR_OPTIONS.map(opt => (
                    <button
                      key={opt.hours}
                      onClick={() => setDvrHours(opt.hours)}
                      className={`flex-1 py-2.5 rounded-lg text-center border transition-colors
                        ${dvrHours === opt.hours
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      <p className="text-sm font-semibold">{opt.hours} hrs</p>
                      <p className={`text-xs mt-0.5 ${dvrHours === opt.hours ? 'text-blue-100' : 'text-gray-400'}`}>
                        {opt.price === 0 ? 'included' : `+$${opt.price.toFixed(2)}/mo`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Set-Top Boxes + Remotes */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Set-Top Boxes + Remotes</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ${SET_TOP_BOX_PRICE_PER.toFixed(2)}/box/mo · none included
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StepperButton onClick={() => setSetTopBoxes(v => Math.max(0, v - 1))} disabled={setTopBoxes <= 0}>−</StepperButton>
                    <div className="text-center w-14">
                      <p className="text-2xl font-bold text-gray-900 leading-none">{setTopBoxes}</p>
                      {stbPrice > 0
                        ? <p className="text-xs text-blue-600 font-semibold mt-0.5">+${stbPrice.toFixed(2)}/mo</p>
                        : <p className="text-xs text-gray-400 font-medium mt-0.5">none</p>
                      }
                    </div>
                    <StepperButton onClick={() => setSetTopBoxes(v => Math.min(10, v + 1))} disabled={setTopBoxes >= 10}>+</StepperButton>
                  </div>
                </div>

                {stbDelta > 0 && (
                  <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Package className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      GPC will ship <strong>{stbDelta} Set-Top Box{stbDelta > 1 ? 'es' : ''} + Remote{stbDelta > 1 ? 's' : ''}</strong> to the service address.
                    </p>
                  </div>
                )}
                {stbDelta < 0 && (
                  <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      The customer must return <strong>{Math.abs(stbDelta)} Set-Top Box{Math.abs(stbDelta) > 1 ? 'es' : ''} + Remote{Math.abs(stbDelta) > 1 ? 's' : ''}</strong> to GPC.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Channel add-ons */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <h3 className={`text-base font-semibold ${addOnsEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                Choose optional services{planLabel ? ` for ${planLabel}` : ''}
              </h3>
              <div className="relative group">
                <Info className={`w-4 h-4 cursor-default ${addOnsEnabled ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300'}`} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50">
                  Digital Music channels are included with your selected plan. Enhance your channel lineup with the following add-ons.
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                </div>
              </div>
            </div>
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
                  ...buildServiceOptLines(),
                ] : buildServiceOptLines();
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

                const keptTvLines: CartLine[] = displayPlan ? [
                  { label: displayPlan.name, price: displayPlan.price, group: 'television' as const },
                  ...[...selectedAddOns].map(id => {
                    const a = ADD_ONS.find(x => x.id === id)!;
                    return { label: a.name, price: a.price, group: 'television' as const };
                  }),
                  ...buildServiceOptLines(),
                ] : buildServiceOptLines();

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
                            <span className="text-gray-900">${(total - discount + (isMove2 && moveFeeApplied ? 65 : 0)).toFixed(2)}/mo</span>
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
