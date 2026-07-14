import { useState } from 'react';
import { ChevronDown, AlertTriangle, Info } from 'lucide-react';
import type { Service, OrderItem } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface DeactivateReviewOrderProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  deactivationDate: string;
  selectedServiceIds?: string[];
  deactivationReason?: string;
  orderItems: OrderItem[];
  onBack: () => void;
  onConfirm: () => void;
}

const SERVICE_ID_TO_GROUP: Record<string, string> = {
  internet: 'Residential Internet',
  phone:    'Phone',
  tv:       'iTV Extra',
};

const serviceLineItems: Record<string, { description: string; monthlyCharge: number }[]> = {
  'Residential Internet': [
    { description: 'Service Assurance',  monthlyCharge: 12.99 },
    { description: 'Tech Home Support',  monthlyCharge: 3.50  },
  ],
  'Phone': [
    { description: 'Voice',             monthlyCharge: 25.00 },
    { description: 'Long Distance',     monthlyCharge: 0.00  },
    { description: 'Directory Listing', monthlyCharge: 3.00  },
    { description: 'Caller ID',         monthlyCharge: 8.00  },
    { description: 'Call Waiting',      monthlyCharge: 6.00  },
    { description: 'Voice Mail',        monthlyCharge: 7.00  },
  ],
  'iTV Extra': [
    { description: 'Number Of Streams',    monthlyCharge: 5.00  },
    { description: 'Streaming Devices',    monthlyCharge: 10.00 },
    { description: 'DVR Hours',            monthlyCharge: 20.00 },
    { description: 'Broadcaster Fee',      monthlyCharge: 35.94 },
    { description: 'Connectivity Fee',     monthlyCharge: 0.13  },
    { description: 'Digital Music Channel',monthlyCharge: 0.00  },
    { description: 'Cinemax',             monthlyCharge: 15.00 },
    { description: 'HBO',                 monthlyCharge: 18.00 },
  ],
};

const serviceGroups = Object.keys(serviceLineItems);

const BA_ACTIVE_PLANS: Record<string, { description: string; monthlyCharge: number; serviceId: string }[]> = {
  'ba-00391': [
    { description: 'Internet 2 Gbps',          monthlyCharge: 124.95, serviceId: 'internet' },
    { description: 'Whole Home Wi-Fi',         monthlyCharge:   5.95, serviceId: 'internet' },
    { description: 'iTV Preferred',            monthlyCharge:  79.95, serviceId: 'tv'       },
    { description: 'Cinemax',                  monthlyCharge:  12.99, serviceId: 'tv'       },
    { description: 'FANatic',                  monthlyCharge:   5.99, serviceId: 'tv'       },
  ],
  'ba-00412': [
    { description: 'Equipment lease',          monthlyCharge:  14.99, serviceId: 'internet' },
  ],
  'ba-00558': [
    { description: 'Internet 200 Mbps',        monthlyCharge:  55.95, serviceId: 'internet' },
    { description: 'Whole Home Wi-Fi',         monthlyCharge:   5.95, serviceId: 'internet' },
    { description: 'Phone Bundle',             monthlyCharge:  15.95, serviceId: 'phone'    },
  ],
};

const exemptItems = [
  { description: 'Email' },
  { description: 'Voicemail' },
];

export function DeactivateReviewOrder({ action, selectedSA, deactivationDate, selectedServiceIds, deactivationReason = '', orderItems, onBack, onConfirm }: DeactivateReviewOrderProps) {
  const activeGroups = selectedServiceIds && selectedServiceIds.length > 0
    ? serviceGroups.filter(g => selectedServiceIds.some(id => SERVICE_ID_TO_GROUP[id] === g))
    : serviceGroups;

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set([...activeGroups, 'Exempt Services']));

  const toggle = (name: string) => {
    const next = new Set(collapsed);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsed(next);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const baId = orderItems[0]?.serviceId ?? '';
  const activeServices = BA_ACTIVE_PLANS[baId] ?? [];
  const totalMonthly = activeServices.reduce((sum, s) => sum + s.monthlyCharge, 0);

  const isDeactivating = (serviceId: string) =>
    !selectedServiceIds || selectedServiceIds.length === 0 || selectedServiceIds.includes(serviceId);

  const deactivatedMRC = activeServices
    .filter(s => isDeactivating(s.serviceId))
    .reduce((sum, s) => sum + s.monthlyCharge, 0);
  const showDeactivationFee = deactivationReason !== 'NPD';
  const [deactivationFeeApplied, setDeactivationFeeApplied] = useState(true);
  const baseFee = 10.00;
  const deactivationFee = showDeactivationFee && deactivationFeeApplied ? baseFee : 0;

  const dateObj = new Date(deactivationDate + 'T00:00:00');
  const daysUsed = dateObj.getDate();
  const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
  const proratedTotal = (totalMonthly / daysInMonth) * daysUsed + deactivationFee;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Review Order</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Services', 'Review order']} currentIndex={2} />

      <div className="flex gap-6 items-start">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-[20px] font-bold text-gray-700">Services being Deactivated —</h3>
                <span className="text-[16px] font-bold text-gray-900">{formatDate(deactivationDate)}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Item Description</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Monthly Charge</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {activeGroups.flatMap(groupName => {
                      const items = serviceLineItems[groupName];
                      const isCollapsed = collapsed.has(groupName);

                      return [
                        <tr
                          key={`header-${groupName}`}
                          className="bg-gray-100 border-t border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => toggle(groupName)}
                        >
                          <td colSpan={3} className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                              <span className="font-medium text-gray-900">{groupName}</span>
                              <span className="text-xs text-gray-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                            </div>
                          </td>
                        </tr>,
                        ...(!isCollapsed ? items.map((item, i) => (
                          <tr key={`${groupName}-${i}`} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-4 text-sm text-gray-900 pl-8">{item.description}</td>
                            <td className="px-4 py-4 text-sm text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Deactivation
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right">${item.monthlyCharge.toFixed(2)}</td>
                          </tr>
                        )) : []),
                      ];
                    })}
                    {/* Exempt Services group */}
                    {(() => {
                      const isCollapsed = collapsed.has('Exempt Services');
                      return [
                        <tr
                          key="header-exempt"
                          className="bg-gray-100 border-t border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => toggle('Exempt Services')}
                        >
                          <td colSpan={3} className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                              <span className="font-medium text-gray-900">Exempt Services</span>
                              <span className="text-xs text-gray-500">({exemptItems.length} items)</span>
                            </div>
                          </td>
                        </tr>,
                        ...(!isCollapsed ? exemptItems.map((item, i) => (
                          <tr key={`exempt-${i}`} className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-4 py-4 text-sm text-gray-900 pl-8">{item.description}</td>
                            <td className="px-4 py-4 text-sm text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                Exempt
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-400 text-right">—</td>
                          </tr>
                        )) : []),
                      ];
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Order Summary */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6">
              <div className="pb-4 mb-4 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active Services</p>
                <div className="space-y-1.5">
                  {activeServices.map((svc, i) => {
                    const removing = isDeactivating(svc.serviceId);
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className={removing ? 'text-gray-400 line-through' : 'text-gray-600'}>{svc.description}</span>
                        <span className={removing ? 'text-gray-400 line-through' : 'text-gray-900'}>${svc.monthlyCharge.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">Deactivation: {formatDate(deactivationDate)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Current monthly charges</span>
                  <span className="text-gray-900">${totalMonthly.toFixed(2)}</span>
                </div>
                {showDeactivationFee && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Deactivation fees</span>
                      <button
                        onClick={() => setDeactivationFeeApplied(v => !v)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${deactivationFeeApplied ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${deactivationFeeApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <span className={deactivationFeeApplied ? 'text-gray-900' : 'text-gray-400 line-through'}>${baseFee.toFixed(2)}/mo</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 pb-4 mt-4 border-t border-gray-200">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  Difference
                  <div className="relative group/diff">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/diff:opacity-100 transition-opacity pointer-events-none z-10 font-normal">
                      Net change in monthly recurring charges. Fees may reduce the net savings.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                </span>
                <span className="text-base font-bold text-red-600">-${(deactivatedMRC - deactivationFee).toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 flex items-center gap-1.5">
                    Remaining Charges
                    <div className="relative group/rem">
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/rem:opacity-100 transition-opacity pointer-events-none z-10 font-normal">
                        Amount owed for the days already consumed in the current billing cycle, plus the deactivation fee.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>
                  </span>
                  <span className="text-xl font-medium text-gray-900">${proratedTotal.toFixed(2)}</span>
                </div>
              </div>

           
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mt-6">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          The user is about to deactivate products and its related features on <strong>{formatDate(deactivationDate)}</strong>. The customer can reactivate at any time.
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
          className="px-8 py-2.5 rounded-md text-sm font-medium border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all"
        >
          Confirm Deactivation
        </button>
      </div>
    </div>
  );
}
