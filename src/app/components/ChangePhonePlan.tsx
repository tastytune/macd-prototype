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
  isAddLocation?: boolean;
  isPhoneStandalone?: boolean;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: (planId: string, lines: CartLine[]) => void;
}

const PLANS = [
  { id: 'phone-bundle',     title: 'Phone Bundle',     subtitle: '', price: 17.50, topPick: false },
  { id: 'phone-standalone', title: 'Standalone Phone', subtitle: '', price: 0,     topPick: false },
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

const INTEREXCHANGE_CARRIER_OPTIONS = [
  'AT & T',
  'CenturyLink',
  'ComcastCommunications Corporation of Indiana',
  'Frontier',
  'Maplenet Wireless',
  'Mediacom',
  'Metronet',
  'Other',
  'Spectrum',
  'Verizon',
  'Windstream',
];

// Interexchange carrier selection is split into Interlata (between LATAs) and
// Intralata (within the same LATA) — each needs its own selectable carrier.
const INTERLATA_CARRIER_STANDALONE: PhoneBundleFeature = {
  id: 'interlata-carrier', name: 'Interlata Carrier', basePrice: 0, manageable: 'attribute',
  attributeOptions: INTEREXCHANGE_CARRIER_OPTIONS,
  defaultAttribute: 'Other',
};

const INTRALATA_CARRIER_STANDALONE: PhoneBundleFeature = {
  id: 'intralata-carrier', name: 'Intralata Carrier', basePrice: 0, manageable: 'attribute',
  attributeOptions: INTEREXCHANGE_CARRIER_OPTIONS,
  defaultAttribute: 'Other',
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

// SAs whose existing service already includes Phone Bundle — the plan card starts
// pre-selected (editable) on this screen instead of requiring a click on SELECT.
const SA_HAS_PHONE_BUNDLE = new Set(['sa-00912', 'sa-01047']);

export function ChangePhonePlan({ selectedSA, previousLines, isDowngrade, isUpgrade, isMove2 = false, isAddLocation = false, isPhoneStandalone = false, selectedPromos = new Set(), onPromoToggle, onBack, onSkip, onNext }: ChangePhonePlanProps) {
  const isLegacyFlow = isMove2 || isAddLocation;

  const [selectedPlan, setSelectedPlan] = useState<string | null>(() => {
    if (isLegacyFlow) {
      if (isPhoneStandalone) return 'phone-bundle';
      return SA_HAS_PHONE_BUNDLE.has(selectedSA?.id ?? '') ? 'phone-bundle' : null;
    }
    if (isPhoneStandalone) return 'phone-standalone';
    return 'phone-bundle';
  });
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);
  const [removedFeatures, setRemovedFeatures] = useState<Set<string>>(new Set());
  // LOA (retain number at old address) — Move only: CRC flags that the customer wants to
  // keep this phone number at the origin address instead of it moving with the account,
  // and must confirm they discussed the implications with the customer before submitting.
  const [loaRequested, setLoaRequested] = useState(false);
  const [loaDiscussed, setLoaDiscussed] = useState(false);

  // The account's actual current phone service, outside this screen — drives the Active
  // badge and the Internet/Television warnings below. Meaningful for the Change flow only;
  // Move2 and Add On New Location keep their own pre-existing single-card model.
  const actualCurrentPlanId: string = isPhoneStandalone ? 'phone-standalone' : 'phone-bundle';

  // Phone Bundle / Standalone Phone — this screen's two Change-flow options are mutually
  // exclusive: selecting one deselects the other (see handlePlanClick below).
  const standaloneActive = isLegacyFlow ? isPhoneStandalone : selectedPlan === 'phone-standalone';
  const movingAwayFromBundle = !isLegacyFlow && actualCurrentPlanId === 'phone-bundle' && selectedPlan !== 'phone-bundle';
  const movingToBundle       = !isLegacyFlow && actualCurrentPlanId !== 'phone-bundle' && selectedPlan === 'phone-bundle';

  // Phone Bundle requires an active Internet line on the account — without one, the Bundle
  // card is shown but disabled, with its button explaining why.
  const hasInternet = previousLines.some(l => l.group === 'internet');

  const defaultAttributeValuesFor = (planId: string | null): Record<string, string> => {
    if (planId === 'phone-standalone') {
      return {
        'directory-listing': 'Published',
        'long-distance': 'Simplicity',
        ...(isMove2 ? {} : { 'interlata-carrier': 'Other', 'intralata-carrier': 'Other' }),
      };
    }
    if (planId === 'phone-bundle') {
      return { 'directory-listing': 'Published', 'long-distance': 'Unlimited' };
    }
    return {};
  };

  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(() => defaultAttributeValuesFor(selectedPlan));

  // Builds the feature list for a variant (Bundle vs Standalone pricing/options) — shared by
  // the price/cart math below (for whichever plan is selected) and by each card's own
  // always-visible feature rows.
  const buildFeatureList = (standalone: boolean): PhoneBundleFeature[] => {
    return PHONE_BUNDLE_FEATURES.flatMap(f => {
      let feature = f;
      if (standalone) {
        if (f.id === 'long-distance') feature = LONG_DISTANCE_STANDALONE;
        if (f.id === 'call-waiting') feature = CALL_WAITING_STANDALONE;
        if (f.id === 'caller-id') feature = CALLER_ID_STANDALONE;
        if (f.id === 'voicemail') feature = VOICEMAIL_STANDALONE;
      }
      // Interlata / Intralata Carrier — every Standalone card (Change action, not Move2) —
      // placed right after Directory Listing
      if (f.id === 'directory-listing' && standalone && !isMove2) {
        return [feature, INTERLATA_CARRIER_STANDALONE, INTRALATA_CARRIER_STANDALONE];
      }
      return [feature];
    });
  };

  const features = buildFeatureList(standaloneActive);

  const currentPlanId = SA_PHONE_PLAN[selectedSA?.id ?? ''] ?? null;
  const activePlan    = PLANS.find(p => p.id === selectedPlan);

  const removableBaseTotal = features
    .filter(f => f.manageable === 'removable')
    .reduce((sum, f) => sum + f.basePrice, 0);
  const removedFeaturesAdj = [...removedFeatures].reduce((sum, id) => {
    const f = features.find(f => f.id === id);
    return sum + (f?.basePrice ?? 0);
  }, 0);

  const toggleRemoveFeature = (id: string) => {
    setRemovedFeatures(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePlanClick = (plan: typeof PLANS[0]) => {
    if (isLegacyFlow) {
      if (plan.id === currentPlanId) return;
      if (isPhoneStandalone) return;
      const next = selectedPlan === plan.id ? null : plan.id;
      setSelectedPlan(next);
      if (next !== 'phone-bundle') {
        setRemovedFeatures(new Set());
        setAttributeValues({ 'directory-listing': 'Published', 'long-distance': 'Unlimited' });
      }
      return;
    }
    // Phone Bundle / Standalone Phone — mutually exclusive, selecting one deselects the other.
    if (selectedPlan === plan.id) return;
    setSelectedPlan(plan.id);
    setRemovedFeatures(new Set());
    setAttributeValues(defaultAttributeValuesFor(plan.id));
  };

  const saAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';

  /* ── Order Summary line computation ── */
  const buildSummaryLines = (): CartLine[] => {
    if (!selectedPlan) return [];
    const label = selectedPlan === 'phone-standalone' ? 'Phone Standalone' : 'Phone Bundle';
    // Main line = base + removable adj only (attrs shown as sub-items to avoid double-counting)
    const baseForSummary = PHONE_BUNDLE_BASE + removableBaseTotal - removedFeaturesAdj;
    const main: CartLine = { label, price: baseForSummary, group: 'phone' };
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
    if (isMove2 && loaRequested) {
      mods.push({ label: 'Retain number at old address (LOA on file)', price: 0, group: 'phone-changed' });
    }
    return [main, ...mods];
  };

  /* ── Change-flow card: Phone Bundle / Standalone Phone ── */
  const renderPhoneOption = (plan: typeof PLANS[0]) => {
    const isSelected = selectedPlan === plan.id;
    const isActualCurrent = plan.id === actualCurrentPlanId;
    const cardFeatures = buildFeatureList(plan.id === 'phone-standalone');
    const isDisabled = plan.id === 'phone-bundle' && !isSelected && !hasInternet;

    return (
      <div
        key={plan.id}
        onClick={() => { if (!isDisabled) handlePlanClick(plan); }}
        className={`relative w-full h-full rounded-[10px] border-2 p-8 text-center transition-all flex flex-col
          ${isDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-70'
            : `cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'}`}`}
      >
        <div className={`text-2xl font-black mb-3 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
          {plan.id === 'phone-standalone' ? 'Phone Standalone' : plan.title}
        </div>

        {isActualCurrent && (
          isSelected ? (
            <span className="self-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-2">
              Active
            </span>
          ) : (
            <span className="self-center text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 mb-2 line-through">
              Active
            </span>
          )
        )}

        <div className="mt-2 mb-4 text-left border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
            <div className="space-y-3">
              {cardFeatures.map(f => {
                const isRemoved = isSelected && removedFeatures.has(f.id);
                const attrVal   = f.manageable === 'attribute' ? (isSelected ? (attributeValues[f.id] ?? f.defaultAttribute ?? '') : (f.defaultAttribute ?? '')) : null;
                const attrAdj   = attrVal && f.attributePrices ? (f.attributePrices[attrVal] ?? 0) : 0;
                const rowPrice  = f.basePrice + attrAdj;

                return (
                  <div key={f.id} className="flex justify-between items-center gap-2">
                    <span className={`text-sm flex-1 flex items-center gap-1 ${isSelected && isRemoved ? 'text-gray-400 line-through' : isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {f.name}
                      {f.id === 'long-distance' && plan.id === 'phone-standalone' && (
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
                        className="text-sm border border-blue-200 rounded-md px-2 py-1 bg-white text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer flex-shrink-0 truncate w-40"
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
                      <span className={`text-sm flex-shrink-0 ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                        {rowPrice === 0 ? 'Included' : `$${rowPrice.toFixed(2)}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
        </div>

        <div className="mt-auto pt-6 flex justify-center">
          <div className={`relative group/bundlebtn px-10 py-1.5 rounded-[10px] text-sm font-bold uppercase tracking-wide transition-colors
            ${isDisabled
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : `cursor-pointer ${isSelected ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}`}>
            {isSelected ? 'Selected' : 'Select'}
            {isDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-900 text-white text-xs font-normal normal-case tracking-normal rounded-lg opacity-0 group-hover/bundlebtn:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                Select Internet to enable Phone Bundle.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">{isAddLocation ? 'Add On New Location' : isMove2 ? 'Move Phone Service' : 'Change Phone Service'}</h1>
        <ContextBar action={isAddLocation ? 'addLocation' : isMove2 ? 'move2' : 'change'} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={(isMove2 || isAddLocation)
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={(isMove2 || isAddLocation) ? 3 : 2}
      />

      <div className="flex gap-8 items-start">

        {/* ── Left: plan cards ── */}
        <div className="flex-1 min-w-0">

          {(() => {
            if (isLegacyFlow) {
              // ── Move2 / Add On New Location: unchanged single Phone Bundle card (or, when
              // isPhoneStandalone is forced true, its Standalone-styled read-only look) ──
              const legacyPlan = PLANS.find(p => p.id === 'phone-bundle')!;
              const isCurrent = legacyPlan.id === currentPlanId;
              const isSelected = selectedPlan === legacyPlan.id;
              const isActiveBundle = !isMove2 && !isPhoneStandalone && SA_HAS_PHONE_BUNDLE.has(selectedSA?.id ?? '');

              const legacyCard = (
                <div
                  key={legacyPlan.id}
                  onClick={() => handlePlanClick(legacyPlan)}
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
                    {isPhoneStandalone ? 'Phone Standalone' : (legacyPlan.subtitle || legacyPlan.title)}
                  </div>

                  {(isCurrent || isPhoneStandalone || isActiveBundle) && (
                    isPhoneStandalone ? (
                      <span className="self-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-2">
                        Active
                      </span>
                    ) : isMove2 && isCurrent ? (
                      (selectedPlan && selectedPlan !== currentPlanId) ? (
                        <span className="self-center text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 mb-2 line-through">
                          Move
                        </span>
                      ) : (
                        <span className="self-center text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full px-2.5 py-0.5 mb-2">
                          Move
                        </span>
                      )
                    ) : isActiveBundle ? (
                      isSelected ? (
                        <span className="self-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-2">
                          Active
                        </span>
                      ) : (
                        <span className="self-center text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 mb-2 line-through">
                          Active
                        </span>
                      )
                    ) : (selectedPlan && selectedPlan !== currentPlanId) ? (
                      <span className="self-center text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5 mb-2 line-through">
                        Active
                      </span>
                    ) : (
                      <span className="self-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-0.5 mb-2">
                        Active
                      </span>
                    )
                  )}

                  <div className="mt-2 mb-4 text-left border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
                    <div className="space-y-3">
                      {features.map(f => {
                        const isRemoved = removedFeatures.has(f.id);
                        const attrVal   = f.manageable === 'attribute' ? (attributeValues[f.id] ?? f.defaultAttribute ?? '') : null;
                        const attrAdj   = attrVal && f.attributePrices ? (f.attributePrices[attrVal] ?? 0) : 0;
                        const rowPrice  = f.basePrice + attrAdj;

                        return (
                          <div key={f.id} className="flex justify-between items-center gap-2">
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
                                className="text-sm border border-blue-200 rounded-md px-2 py-1 bg-white text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer flex-shrink-0 truncate w-40"
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

                  {!isPhoneStandalone && (isCurrent ? (
                    <div className="mt-auto pt-6">
                      <p className="text-xs text-gray-400 mb-4">Select another plan to upgrade or change</p>
                      {isMove2 ? (
                        (selectedPlan && selectedPlan !== currentPlanId) ? (
                          <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-red-50 text-red-400 line-through border border-red-200">
                            Moving
                          </div>
                        ) : (
                          <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-purple-100 text-purple-600">
                            Moving
                          </div>
                        )
                      ) : (selectedPlan && selectedPlan !== currentPlanId) ? (
                        <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-red-50 text-red-400 line-through border border-red-200">
                          Your Current Plan
                        </div>
                      ) : (
                        <div className="w-full py-1.5 rounded-[10px] text-sm font-semibold uppercase tracking-wide cursor-default bg-gray-100 text-gray-400">
                          Your Current Plan
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-auto pt-6 flex justify-center">
                      <div className={`relative group flex items-center gap-1.5 px-10 py-1.5 rounded-[10px] text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {isSelected ? (isActiveBundle ? 'Deselect' : 'Selected') : 'Select'}
                        {isActiveBundle && (
                          <>
                            <Info size={14} className="flex-shrink-0" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-lg bg-gray-800 text-white text-xs normal-case font-normal leading-snug text-center opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                              {isSelected
                                ? 'Deselecting Phone Bundle converts this line to Phone Standalone and disconnects Internet and Television services.'
                                : 'Switching from Phone Standalone to Phone Bundle requires active Internet service.'}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );

              return (
                <div className="flex items-start gap-6 mb-10">
                  <div style={{ flex: '0 0 65%' }}>
                    {legacyCard}
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

            // ── Change flow: Phone Bundle / Standalone Phone — pick one ──
            return (
              <div className="grid grid-cols-2 gap-4 mb-6 items-stretch">
                {PLANS.map(plan => (
                  <div key={plan.id} className="flex flex-col">{renderPhoneOption(plan)}</div>
                ))}
              </div>
            );
          })()}

          {!isLegacyFlow && (movingAwayFromBundle || movingToBundle) && (
            <div className="mb-6 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                {movingAwayFromBundle
                  ? 'Selecting Phone Standalone disconnects Internet and Television services.'
                  : 'Switching to Phone Bundle requires active Internet service.'}
              </span>
            </div>
          )}

          {/* LOA — retain number at old address (Move only, once a phone plan is selected) */}
          {isMove2 && selectedPlan && (
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={loaRequested}
                  onChange={e => {
                    const checked = e.target.checked;
                    setLoaRequested(checked);
                    if (!checked) setLoaDiscussed(false);
                  }}
                  className="w-4 h-4 mt-0.5 rounded accent-amber-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-amber-900">
                  <span className="font-semibold">LOA:</span> Customer wants to retain this phone number at the old service address instead of moving it.
                </span>
              </label>

              {loaRequested && (
                <div className="mt-4 pl-7">
                  <div className="flex items-start gap-2 mb-3 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Retaining the number creates a separate line at the origin address and may involve additional charges. Discuss this with the customer before submitting the order.</span>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={loaDiscussed}
                      onChange={e => setLoaDiscussed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded accent-amber-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm text-amber-900">
                      I have discussed this with the customer.
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

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
                if (loaRequested && !loaDiscussed) return;
                const summaryLines = buildSummaryLines();
                const nonPhoneLines = previousLines.filter(l => l.group !== 'phone' && l.group !== 'phone-removed' && l.group !== 'phone-changed' && !(movingAwayFromBundle && (l.group === 'internet' || l.group === 'television')));
                onNext(selectedPlan, [...nonPhoneLines, ...summaryLines]);
              }}
              disabled={!selectedPlan || (loaRequested && !loaDiscussed)}
              className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
                ${selectedPlan && !(loaRequested && !loaDiscussed) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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

                const nonPhoneLines = previousLines.filter(l => l.group !== 'phone' && l.group !== 'phone-removed' && l.group !== 'phone-changed' && !(movingAwayFromBundle && (l.group === 'internet' || l.group === 'television')));
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
                        <span className="text-red-400">{line.label}</span>
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
