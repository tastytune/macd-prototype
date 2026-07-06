import { Check, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface MoveServicesStep5Props {
  scenario: string;
  selectedSA?: Service | null;
  destinationAddress: string;
  selectedServiceIds: string[];
  billingEndDate: string;
  installationDate: string;
  timeSlot?: string;
  onBack: () => void;
  onSubmit: () => void;
}

// Original services active at the origin address (used to compute "Disconnecting")
const SA_BASE_SERVICES: Record<string, { id: string; name: string; price: number }[]> = {
  'sa-00912': [
    { id: 'internet', name: 'Internet 2Gbps', price: 124.95 },
    { id: 'itv',      name: 'iTV Preferred', price: 79.95  },
    { id: 'cinemax',  name: 'Cinemax',       price: 12.99  },
    { id: 'fanatic',  name: 'FANatic',       price: 5.99   },
  ],
  'sa-01047': [
    { id: 'internet-200m', name: 'Internet 200M', price: 69.95 },
    { id: 'phone-bundle',  name: 'Phone Bundle',  price: 29.95 },
  ],
};

// Full catalog to resolve any selected service ID → name + price
const SERVICE_CATALOG: { id: string; name: string; price: number }[] = [
  { id: 'internet',          name: 'Internet 2Gbps',           price: 124.95 },
  { id: 'itv',               name: 'iTV Preferred',           price: 79.95  },
  { id: 'cinemax',           name: 'Cinemax',                 price: 12.99  },
  { id: 'fanatic',           name: 'FANatic',                 price: 5.99   },
  { id: 'internet-coax-200', name: 'Internet 200 Mbps',       price: 79.95  },
  { id: 'internet-coax-1g',  name: 'Internet 1 Gbps',         price: 99.95  },
  { id: 'internet-200m',     name: 'Internet 200M',           price: 69.95  },
  { id: 'phone-bundle',      name: 'Phone Bundle',            price: 29.95  },
  { id: 'm04-1gig',          name: 'Internet 1 Gbps (Offer)',  price: 49.95  },
  { id: 'm04-2gig',          name: 'Internet 2 Gbps (Offer)',  price: 109.95 },
  { id: 'itv-75',            name: 'iTV Essentials',          price: 49.95  },
  { id: 'itv-150',           name: 'iTV Preferred',           price: 79.95  },
  { id: 'itv-250',           name: 'iTV Extra',               price: 109.95 },
  { id: 'tv-hbo',            name: 'HBO',                     price: 14.99  },
  { id: 'tv-cinemax',        name: 'Cinemax',                 price: 12.99  },
  { id: 'tv-fanatic',        name: 'FANatic',                 price: 5.99   },
  { id: 'tv-showtime',       name: 'Showtime',                price: 10.99  },
  { id: 'tv-starz',          name: 'STARZ',                   price: 8.99   },
];

const MOVE_TYPE_LABEL: Record<string, string> = {
  M01: 'M01 — Full move',
  M02: 'M02 — Partial move',
  M03: 'M03 — Technology change',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}


export function MoveServicesStep5({
  scenario,
  selectedSA,
  destinationAddress,
  selectedServiceIds,
  billingEndDate,
  installationDate,
  timeSlot,
  onBack,
  onSubmit,
}: MoveServicesStep5Props) {
  const originAddress = selectedSA?.address ?? '412 Oak Ave, Lincoln, NE 68501';
  const technology = scenario === 'M03' ? 'Fiber → Coax (technology change)' : 'Fiber → Fiber (no change)';

  const baseServices = SA_BASE_SERVICES[selectedSA?.id ?? ''] ?? SA_BASE_SERVICES['sa-00912'];
  const movingServices = selectedServiceIds
    .map(id => SERVICE_CATALOG.find(s => s.id === id))
    .filter((s): s is { id: string; name: string; price: number } => s !== undefined);
  const disconnectingServices = baseServices.filter(s => !selectedServiceIds.includes(s.id));
  const originalMRC = baseServices.reduce((sum, s) => sum + s.price, 0);
  const newMRC = movingServices.reduce((sum, s) => sum + s.price, 0);
  const mrcDiff = newMRC - originalMRC;

  const [collapsed, setCollapsed] = useState(false);
  const [moveFeeApplied, setMoveFeeApplied] = useState(true);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Move Services</h1>
        <ContextBar action={'move' as MACDAction} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']} currentIndex={4} />

      <div className="flex gap-6 items-start">

        {/* ── Left: services table ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-[20px] font-bold text-gray-700">Services being Moved</h3>
                {installationDate && (
                  <span className="text-[16px] font-bold text-gray-900">
                    — {formatDate(installationDate)}
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
                    {/* Moving services group */}
                    <tr
                      className="bg-gray-100 border-t border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => setCollapsed(c => !c)}
                    >
                      <td colSpan={3} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                          <span className="font-medium text-gray-900">Services</span>
                          <span className="text-xs text-gray-500">({movingServices.length + disconnectingServices.length} items)</span>
                        </div>
                      </td>
                    </tr>

                    {!collapsed && <>
                      {movingServices.map(svc => (
                        <tr key={svc.id} className="border-b border-gray-100 bg-[#faf0fa]/40">
                          <td className="px-4 py-3.5 text-sm text-gray-900 pl-8 font-medium">{svc.name}</td>
                          <td className="px-4 py-3.5 text-sm text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f3e8f3] text-[#800080] border border-[#d9a0d9]">
                              Moving
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-900 text-right font-medium">${svc.price.toFixed(2)}</td>
                        </tr>
                      ))}
                      {disconnectingServices.map(svc => (
                        <tr key={svc.id} className="border-b border-gray-100 bg-red-50/40">
                          <td className="px-4 py-3.5 text-sm text-gray-500 pl-8 line-through">{svc.name}</td>
                          <td className="px-4 py-3.5 text-sm text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              Disconnecting
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-400 text-right line-through">${svc.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </>}
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

              {/* Move details */}
              <div className="pb-4 mb-4 border-b border-gray-200 space-y-1">
                {originAddress && <p className="text-xs text-gray-500">From: <strong className="text-gray-700">{originAddress}</strong></p>}
                {destinationAddress && <p className="text-xs text-gray-500">To: <strong className="text-gray-700">{destinationAddress}</strong></p>}
                {billingEndDate && <p className="text-xs text-gray-500">Billing end: {formatDate(billingEndDate)}</p>}
                {installationDate && <p className="text-xs text-gray-500">Installation: {formatDate(installationDate)}</p>}
                <p className="text-xs text-gray-500">{technology}</p>
              </div>

              {/* Charges */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">New monthly charges</span>
                  <span className="text-gray-900">${newMRC.toFixed(2)}</span>
                </div>
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
              </div>

              <div className="pt-4 border-t-2 border-gray-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total Monthly</span>
                  <span className="text-xl font-medium text-gray-900">${newMRC.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    Difference
                    <div className="relative group/diff">
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/diff:opacity-100 transition-opacity pointer-events-none z-10 font-normal">
                        Net change in monthly recurring charges compared to your current plan.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>
                  </span>
                  <span className={`font-semibold ${
                    mrcDiff < 0 ? 'text-red-600'
                    : mrcDiff > 0 ? 'text-green-600'
                    : 'text-gray-500'
                  }`}>
                    {mrcDiff === 0 ? '$0.00'
                      : mrcDiff > 0 ? `+$${mrcDiff.toFixed(2)}`
                      : `-$${Math.abs(mrcDiff).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-[#faf0fa] border border-[#d9a0d9] rounded-lg mt-6">
        <AlertTriangle className="w-4 h-4 text-[#800080] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#800080]">
          The user is about to move services
          {billingEndDate ? <> with billing ending on <strong>{formatDate(billingEndDate)}</strong></> : ''}
          {installationDate ? <> and installation scheduled for <strong>{formatDate(installationDate)}</strong>{timeSlot ? <> (<strong>{timeSlot}</strong>)</> : ''}</> : ''}
          . This action cannot be undone.
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
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-8 py-2.5 rounded-md text-sm font-medium border border-[#d9a0d9] bg-[#faf0fa] text-[#800080] hover:bg-[#f3e8f3] transition-all"
        >
          <Check className="w-4 h-4" />
          Submit Move Order
        </button>
      </div>

    </div>
  );
}
