import { MapPin, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import type { WorkOrderResult } from './FollowOnWorkOrder';
import type { FollowOnRequesterType } from './FollowOnRequesterType';

interface ServiceabilityCheckProps {
  workOrder: WorkOrderResult;
  onBack: () => void;
  onContinue: () => void;
  requesterType?: FollowOnRequesterType | null;
}

const SERVICE_PILLS = ['Internet 200Mbps', 'iTV Preferred', 'Cinemax', 'FANatic'];
const SPECIAL_PILLS: { label: string; style: string }[] = [
  { label: 'Price Lock', style: 'bg-indigo-100 text-indigo-700' },
  { label: 'Promo', style: 'bg-pink-100 text-pink-700' },
];

export function ServiceabilityCheck({ workOrder, onBack, onContinue, requesterType }: ServiceabilityCheckProps) {
  const { customerName, saId, saLabel, address, id: workOrderId } = workOrder;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <Breadcrumb
        steps={[requesterType === 'crc' ? 'CRC' : 'Technician', 'Serviceability', 'Service Type', 'Plan', 'Review Order', 'Confirmation']}
        currentIndex={1}
        variant="plain"
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Serviceability Check</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
            On-Site Upsell
          </span>
          <p className="text-gray-800 font-semibold text-sm">
            {customerName} · {saId} · {saLabel} · {address}
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1.5">
          Confirm the service account can be provisioned at this address
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Run a serviceability check for the selected service account before offering the change to the customer.
        </p>

        {/* Selected SA */}
        <div className="rounded-xl border-2 border-blue-500 bg-blue-50 p-5 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 mt-1.5 rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-bold text-gray-900">{saId} · {saLabel}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                    Active
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                    Installing
                  </span>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {address}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Work Order: <span className="font-semibold text-gray-700">{workOrderId}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {SERVICE_PILLS.map((pill) => (
                  <span key={pill} className="text-sm font-bold px-4 py-1.5 rounded-full bg-indigo-600 text-white">
                    {pill}
                  </span>
                ))}
                {SPECIAL_PILLS.map((pill) => (
                  <span key={pill.label} className={`text-sm font-bold px-4 py-1.5 rounded-full ${pill.style}`}>
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Serviceability results */}
        <p className="text-xs font-bold text-gray-400 tracking-wide uppercase mb-3">
          Serviceability Check · {saId} · {address.toUpperCase()}
        </p>
        <div className="flex flex-wrap gap-3 mb-5">
          <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-green-50 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Fiber available
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-green-50 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Voice portable
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border border-amber-400 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            Buried drop — 10 biz days
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl px-5 py-4">
          <Info className="w-4 h-4 flex-shrink-0" />
          Same technology available — full and partial moves are available.
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-7 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
