import { useState } from 'react';
import { ChevronDown, HelpCircle, AlertTriangle } from 'lucide-react';
import { PromoSection, PROMOS } from './ChangePromos';
import type { Service, CartLine } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface ChangeReviewOrderProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  installationDate: string;
  installationSlot?: string;
  cartLines: CartLine[];
  isDowngrade?: boolean;
  isUpgrade?: boolean;
  isMove2?: boolean;
  destinationAddress?: string;
  selectedPromos?: Set<string>;
  onPromoToggle?: (id: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  'morning-1':   '8:00 AM – 10:00 AM',
  'morning-2':   '10:00 AM – 12:00 PM',
  'afternoon-1': '1:00 PM – 3:00 PM',
  'afternoon-2': '3:00 PM – 5:00 PM',
};

type GroupKey = 'internet' | 'television' | 'phone';

const SA_CURRENT_PLANS: Record<string, Partial<Record<GroupKey, { description: string; monthlyCharge: number }[]>>> = {
  'sa-00912': {
    internet: [
      { description: 'Internet 2 Gbps',    monthlyCharge: 124.95 },
      { description: 'Elite Wi-Fi',        monthlyCharge: 5.95   },
      { description: 'Tech Home Support',  monthlyCharge: 14.99  },
    ],
    television: [
      { description: 'iTV Preferred',                  monthlyCharge: 79.95 },
      { description: 'Cinemax',                        monthlyCharge: 12.99 },
      { description: 'FANatic',                        monthlyCharge: 5.99  },
    ],
  },
  'sa-01047': {
    internet: [
      { description: 'Internet 200 Mbps', monthlyCharge: 55.95 },
      { description: 'Elite Wi-Fi',       monthlyCharge: 5.95  },
      { description: 'Tech Home Protect', monthlyCharge: 5.99  },
    ],
  },
};

const DEFAULT_CURRENT_PLANS: Partial<Record<GroupKey, { description: string; monthlyCharge: number }[]>> = {
  internet: [
    { description: 'Internet 200 Mbps', monthlyCharge: 55.95 },
    { description: 'Elite Wi-Fi',  monthlyCharge: 5.95  },
  ],
  television: [
    { description: 'iTV Essentials',  monthlyCharge: 49.95 },
  ],
  phone: [],
};

const GROUP_LABEL: Record<GroupKey, string> = {
  internet:   'Internet Service',
  television: 'Television Service',
  phone:      'Phone Service',
};

const GROUP_ORDER: GroupKey[] = ['internet', 'television', 'phone'];

export function ChangeReviewOrder({ action, selectedSA, installationDate, installationSlot, cartLines, isDowngrade, isUpgrade, isMove2 = false, destinationAddress, selectedPromos = new Set(), onPromoToggle, onBack, onConfirm }: ChangeReviewOrderProps) {
  const currentPlans = SA_CURRENT_PLANS[selectedSA?.id ?? ''] ?? DEFAULT_CURRENT_PLANS;
  const activeGroups = isMove2
    ? GROUP_ORDER.filter(g => cartLines.some(l => l.group === g) || (currentPlans[g] ?? []).length > 0)
    : GROUP_ORDER.filter(g => cartLines.some(l => l.group === g));
  const [collapsed, setCollapsed] = useState<Set<GroupKey>>(new Set());
  const [billingPref, setBillingPref] = useState<'electronic' | 'paper'>('electronic');
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);

  const toggle = (g: GroupKey) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  const addedTotal = cartLines.reduce((s, l) => s + l.price, 0);
  const currentTotal = activeGroups.reduce((sum, g) =>
    sum + (currentPlans[g] ?? []).reduce((s, i) => s + i.monthlyCharge, 0), 0
  );

  // Bundle discounts — Internet + TV bundled together
  const hasInternetInCart = cartLines.some(l => l.group === 'internet' && l.label.startsWith('Internet'));
  const tvPlanLine = cartLines.find(l => l.group === 'television' &&
    (l.label.includes('Essentials') || l.label.includes('Preferred') || l.label.includes('Extra')));
  const bundleDiscounts: { label: string; amount: number }[] = [];
  if (hasInternetInCart && tvPlanLine) {
    if (tvPlanLine.label.includes('Essentials')) {
      bundleDiscounts.push({ label: 'Internet Bundle Discount', amount: 9 });
      bundleDiscounts.push({ label: 'TV Bundle Discount', amount: 6 });
    } else {
      bundleDiscounts.push({ label: 'Internet Bundle Discount', amount: 25 });
      bundleDiscounts.push({ label: 'TV Bundle Discount', amount: 16 });
    }
  }
  const totalBundleDiscount = bundleDiscounts.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Review Order</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={isMove2
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={isMove2 ? 5 : 4}
      />

      <div className="flex gap-6 items-start">

        {/* ── Left: service table ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-[20px] font-bold text-gray-700">{isMove2 ? 'Services being Moved' : 'Services being Changed'}</h3>
                {installationDate && (
                  <span className="text-[16px] font-bold text-gray-900">
                    — {formatDate(installationDate)}{installationSlot && TIME_SLOT_LABELS[installationSlot] ? `, ${TIME_SLOT_LABELS[installationSlot]}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Item Description</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Monthly Charge</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {activeGroups.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No services selected.</td>
                      </tr>
                    ) : activeGroups.flatMap(group => {
                      const isCollapsed = collapsed.has(group);
                      const currentItems = currentPlans[group] ?? [];
                      const newItems = cartLines.filter(l => l.group === group);
                      const normalize = (s: string) => s.toLowerCase().trim();
                      const currentDescs = new Set(currentItems.map(i => normalize(i.description)));
                      const newLabels = new Set(newItems.map(l => normalize(l.label)));
                      // In Move: show currentItems as Moving + any genuinely new items as Added
                      // In Change: show diff (removed / added)
                      const addedItems = isMove2
                        ? newItems.filter(l => !currentDescs.has(normalize(l.label)))
                        : newItems.filter(l => !currentDescs.has(normalize(l.label)));
                      const removedItems = isMove2
                        ? []
                        : currentItems.filter(i => !newLabels.has(normalize(i.description)));
                      const totalRows = isMove2
                        ? currentItems.length + addedItems.length
                        : removedItems.length + addedItems.length;

                      return [
                        <tr
                          key={`header-${group}`}
                          className="bg-gray-100 border-t border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => toggle(group)}
                        >
                          <td colSpan={3} className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                              <span className="font-medium text-gray-900">{GROUP_LABEL[group]}</span>
                              <span className="text-xs text-gray-500">
                                ({totalRows} {totalRows === 1 ? 'item' : 'items'})
                              </span>
                            </div>
                          </td>
                        </tr>,

                        ...(!isCollapsed ? [
                          // Move: show all current services as "Moving"
                          ...(isMove2 ? currentItems.map((item, i) => (
                            <tr key={`${group}-moving-${i}`} className="border-b border-gray-100 bg-[#faf0fa]/30">
                              <td className="px-4 py-3.5 text-sm text-gray-900 pl-8 font-medium">{item.description}</td>
                              <td className="px-4 py-3.5 text-sm text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                                  Moving
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-900 text-right font-medium">${item.monthlyCharge.toFixed(2)}</td>
                            </tr>
                          )) : []),
                          // Change: show removed items
                          ...removedItems.map((item, i) => (
                            <tr key={`${group}-removed-${i}`} className="border-b border-gray-100 bg-red-50/40">
                              <td className="px-4 py-3.5 text-sm text-gray-500 pl-8 line-through">{item.description}</td>
                              <td className="px-4 py-3.5 text-sm text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                  Removed
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-400 text-right line-through">${item.monthlyCharge.toFixed(2)}</td>
                            </tr>
                          )),
                          ...addedItems.map((item, i) => (
                            <tr key={`${group}-added-${i}`} className="border-b border-gray-100 bg-green-50/40">
                              <td className="px-4 py-3.5 text-sm text-gray-900 pl-8 font-medium">{item.label}</td>
                              <td className="px-4 py-3.5 text-sm text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                  Added
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-900 text-right font-medium">${item.price.toFixed(2)}</td>
                            </tr>
                          )),
                          // Phone Bundle child modifications (C08: removed, C09: attribute changed)
                          ...(group === 'phone' ? cartLines.filter(l => l.group === 'phone-removed').map((item, i) => (
                            <tr key={`phone-feat-removed-${i}`} className="border-b border-gray-100 bg-red-50/20">
                              <td className="px-4 py-2.5 text-xs text-gray-400 pl-12 line-through border-l-2 border-l-red-200">{item.label}</td>
                              <td className="px-4 py-2.5 text-xs text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600 border border-red-200">Removed</span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-400 text-right">—</td>
                            </tr>
                          )) : []),
                          ...(group === 'phone' ? cartLines.filter(l => l.group === 'phone-changed').map((item, i) => (
                            <tr key={`phone-feat-changed-${i}`} className="border-b border-gray-100 bg-blue-50/20">
                              <td className="px-4 py-2.5 text-xs text-blue-700 pl-12 border-l-2 border-l-blue-200">{item.label}</td>
                              <td className="px-4 py-2.5 text-xs text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">Changed</span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-blue-800 text-right font-medium">
                                {item.price > 0 ? `+$${item.price.toFixed(2)}` : '—'}
                              </td>
                            </tr>
                          )) : []),
                        ] : []),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing Preference — inside the services card */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Billing Preference</p>
              <div className="space-y-2.5">
                {(['electronic', 'paper'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setBillingPref(opt)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${billingPref === opt ? 'border-blue-600' : 'border-gray-300'}`}>
                      {billingPref === opt && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <span className="text-sm text-gray-800">
                      {opt === 'electronic' ? 'Electronic Billing' : 'Paper Statement'}
                    </span>
                    {opt === 'paper' && <span className="text-sm text-gray-500 ml-auto">$5.00</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6">
              {(installationDate || (isMove2 && destinationAddress)) && (
                <div className="pb-4 mb-4 border-b border-gray-200 space-y-1">
                  {isMove2 && destinationAddress && (
                    <p className="text-xs text-gray-500">To: <strong className="text-gray-700">{destinationAddress}</strong></p>
                  )}
                  {installationDate && (
                    <p className="text-xs text-gray-500">Installation: {formatDate(installationDate)}</p>
                  )}
                  {installationSlot && TIME_SLOT_LABELS[installationSlot] && (
                    <p className="text-xs text-gray-500">{TIME_SLOT_LABELS[installationSlot]}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">New monthly charges</span>
                  <span className="text-gray-900">${addedTotal.toFixed(2)}</span>
                </div>
                {bundleDiscounts.map(d => (
                  <div key={d.label} className="flex items-center justify-between text-sm text-green-700">
                    <span>{d.label}</span>
                    <span className="font-medium">−${d.amount.toFixed(2)}</span>
                  </div>
                ))}
                {isMove2 && (
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100 mt-1">
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
              </div>

              {(isDowngrade || isUpgrade) && onPromoToggle && (
                <div className="mt-4">
                  <PromoSection
                    selectedPromos={selectedPromos}
                    onToggle={onPromoToggle}
                    promoIds={isUpgrade ? ['apply-promo'] : undefined}
                    automaticPromoIds={isUpgrade ? ['price-lock'] : []}
                  />
                </div>
              )}

              {(() => {
                const promoDiscount = PROMOS.filter(p => selectedPromos.has(p.id) && p.discount > 0).reduce((s, p) => s + p.discount, 0);
                const moveFee = isMove2 && moveFeeApplied ? 65 : 0;
                const paperFee = billingPref === 'paper' ? 5 : 0;
                const effectiveTotal = addedTotal - totalBundleDiscount - promoDiscount + moveFee + paperFee;
                const diff = effectiveTotal - currentTotal;
                return (
                  <div className="flex items-center justify-between pt-4 pb-4 mt-4 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Difference</span>
                    <span className={`text-base font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-4 border-t-2 border-gray-300">
                {(() => {
                  const promoDiscount = PROMOS.filter(p => selectedPromos.has(p.id) && p.discount > 0).reduce((s, p) => s + p.discount, 0);
                  const moveFee = isMove2 && moveFeeApplied ? 65 : 0;
                  const paperFee = billingPref === 'paper' ? 5 : 0;
                  const effectiveTotal = addedTotal - totalBundleDiscount - promoDiscount + moveFee + paperFee;
                  return (
                    <>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-700 mb-2">
                          <span>Promo discount</span>
                          <span className="font-medium">−${promoDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {paperFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Paper Statement</span>
                          <span className="font-medium">+$5.00</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">Total Monthly</span>
                          <div className="relative group">
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Total monthly recurring charges after the change is applied.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                            </div>
                          </div>
                        </div>
                        <span className="text-xl font-medium text-gray-900">${effectiveTotal.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Warning banner */}
      <div className={`flex items-start gap-3 p-4 rounded-lg mt-6 border ${isMove2 ? 'bg-[#f3e8f3] border-[#d9a0d9]' : 'bg-blue-50 border-blue-200'}`}>
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isMove2 ? 'text-[#800080]' : 'text-blue-500'}`} />
        <p className={`text-sm ${isMove2 ? 'text-[#800080]' : 'text-blue-800'}`}>
          {isMove2
            ? <>The user is about to move services to the new address{installationDate ? <> with installation on <strong>{formatDate(installationDate)}{installationSlot && TIME_SLOT_LABELS[installationSlot] ? `, ${TIME_SLOT_LABELS[installationSlot]}` : ''}</strong></> : ''}. This action can not be undone.</>
            : <>The user is about to change products and its related features{installationDate ? <> on <strong>{formatDate(installationDate)}{installationSlot && TIME_SLOT_LABELS[installationSlot] ? `, ${TIME_SLOT_LABELS[installationSlot]}` : ''}</strong></> : ''}. This action can not be undone.</>
          }
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end gap-3 pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className={`px-8 py-2.5 rounded-md text-sm font-medium border transition-all ${isMove2 ? 'border-[#d9a0d9] bg-[#f3e8f3] text-[#800080] hover:bg-[#ede0ed]' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
        >
          {isMove2 ? 'Confirm Move' : 'Confirm Change'}
        </button>
      </div>
    </div>
  );
}
