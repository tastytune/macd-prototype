import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { Service, CartLine } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

interface ChangeReviewOrderProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  installationDate: string;
  cartLines: CartLine[];
  onBack: () => void;
  onConfirm: () => void;
}

type GroupKey = 'internet' | 'television' | 'phone';

const SA_CURRENT_PLANS: Record<string, Partial<Record<GroupKey, { description: string; monthlyCharge: number }[]>>> = {
  'sa-00912': {
    internet: [
      { description: 'Internet 2 Gig',    monthlyCharge: 124.95 },
      { description: 'Whole Home Wi-Fi',  monthlyCharge: 5.95   },
    ],
    television: [
      { description: 'TV 150+ Channels (iTV Premium)', monthlyCharge: 79.95 },
      { description: 'Cinemax',                        monthlyCharge: 12.99 },
      { description: 'FANatic',                        monthlyCharge: 5.99  },
    ],
  },
  'sa-01047': {
    internet: [
      { description: 'Internet 200 Mbps', monthlyCharge: 55.95 },
      { description: 'Whole Home Wi-Fi',  monthlyCharge: 5.95  },
    ],
    phone: [
      { description: 'Unlimited Local Calling', monthlyCharge: 15.95 },
    ],
  },
};

const DEFAULT_CURRENT_PLANS: Partial<Record<GroupKey, { description: string; monthlyCharge: number }[]>> = {
  internet: [
    { description: 'Internet 200 Mbps', monthlyCharge: 55.95 },
    { description: 'Whole Home Wi-Fi',  monthlyCharge: 5.95  },
  ],
  television: [
    { description: 'TV 75+ Channels', monthlyCharge: 49.95 },
  ],
  phone: [
    { description: 'Unlimited Local Calling', monthlyCharge: 15.95 },
  ],
};

const GROUP_LABEL: Record<GroupKey, string> = {
  internet:   'Internet Service',
  television: 'Television Service',
  phone:      'Phone Service',
};

const GROUP_ORDER: GroupKey[] = ['internet', 'television', 'phone'];

export function ChangeReviewOrder({ action, selectedSA, installationDate, cartLines, onBack, onConfirm }: ChangeReviewOrderProps) {
  const currentPlans = SA_CURRENT_PLANS[selectedSA?.id ?? ''] ?? DEFAULT_CURRENT_PLANS;
  const activeGroups = GROUP_ORDER.filter(g => cartLines.some(l => l.group === g));
  const [collapsed, setCollapsed] = useState<Set<GroupKey>>(new Set());

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Review Order</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: service table ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-[20px] font-bold text-gray-700">Services being Changed</h3>
                {installationDate && (
                  <span className="text-[16px] font-bold text-gray-900">— {formatDate(installationDate)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Items marked <span className="font-semibold text-red-600">Removed</span> will be replaced by items marked <span className="font-semibold text-green-700">Added</span>.
              </p>
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
                      const removedItems = currentPlans[group] ?? [];
                      const addedItems = cartLines.filter(l => l.group === group);
                      const totalRows = removedItems.length + addedItems.length;

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
                        ] : []),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6">
              {installationDate && (
                <div className="pb-4 mb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Installation: {formatDate(installationDate)}</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">New monthly charges</span>
                  <span className="text-gray-900">${addedTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-300">
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
                  <span className="text-xl font-medium text-gray-900">${addedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
          className="px-8 py-2.5 rounded-md text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
        >
          Confirm Change
        </button>
      </div>
    </div>
  );
}
