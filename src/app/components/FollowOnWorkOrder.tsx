import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

interface FollowOnWorkOrderProps {
  onBack: () => void;
  onContinue: (workOrder: WorkOrderResult) => void;
}

export interface WorkOrderResult {
  id: string;
  customerName: string;
  saId: string;
  saLabel: string;
  address: string;
  serviceType: string;
  technician: string;
  techId: string;
  upsellPlanId: string;
}

// Mocked search results — in production this comes from
// GET /technicians/:techId/work-orders?date=today
export const MOCK_WORK_ORDERS: WorkOrderResult[] = [
  {
    id: 'WO-10432',
    customerName: 'Robert Johnson',
    saId: 'SA-00912',
    saLabel: 'Primary',
    address: '412 Oak Ave, Lincoln, NE 68501',
    serviceType: 'Internet Install',
    technician: 'Marcus Webb',
    techId: 'TCH-2291',
    upsellPlanId: '1gig',
  },
];

type SearchState = 'idle' | 'searching' | 'results';

export function FollowOnWorkOrder({ onBack, onContinue }: FollowOnWorkOrderProps) {
  const [workOrderId, setWorkOrderId] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<WorkOrderResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isValid = workOrderId.trim().length > 0;
  const selectedWorkOrder = results.find(wo => wo.id === selectedId) ?? null;

  const handleValidate = () => {
    if (!isValid || searchState === 'searching') return;
    setSelectedId(null);
    setSearchState('searching');
    setTimeout(() => {
      setResults(MOCK_WORK_ORDERS);
      setSearchState('results');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <Breadcrumb
        steps={['Technician', 'Serviceability', 'Service Type', 'Plan', 'Review Order', 'Confirmation']}
        currentIndex={0}
        variant="plain"
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Work Order</h1>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
          On-Site Upsell
        </span>
      </div>

      {/* Lookup card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Look up work orders</h2>

        <label className="block text-sm font-bold text-gray-800 mb-2">Work order ID</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={workOrderId}
            onChange={(e) => {
              setWorkOrderId(e.target.value);
              setSearchState('idle');
              setResults([]);
              setSelectedId(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            placeholder="e.g. WO-1234"
            className="flex-1 px-4 py-3.5 rounded-lg border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleValidate}
            disabled={!isValid || searchState === 'searching'}
            className={`px-6 py-3.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
              ${isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {searchState === 'searching' ? 'Searching…' : 'Search Work Order'}
          </button>
        </div>


        {/* Search results */}
        {searchState === 'results' && (
          <div className="mt-6 space-y-3">
            {results.map((wo) => {
              const isSelected = selectedId === wo.id;
              return (
                <button
                  key={wo.id}
                  onClick={() => setSelectedId(wo.id)}
                  className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-inset ring-blue-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{wo.id}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {wo.customerName} · {wo.saId} · {wo.saLabel}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{wo.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tech: {wo.technician} · {wo.techId}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                      {wo.serviceType}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirmation banner */}
        {selectedWorkOrder && (
          <div className="mt-4 flex items-center gap-3 px-5 py-4 rounded-xl border border-green-200 bg-green-50">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {selectedWorkOrder.technician} ({selectedWorkOrder.techId}) · confirmed on {selectedWorkOrder.id}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedWorkOrder.customerName} · {selectedWorkOrder.saId} · {selectedWorkOrder.saLabel} · {selectedWorkOrder.address}
              </p>
            </div>
          </div>
        )}
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
          onClick={() => selectedWorkOrder && onContinue(selectedWorkOrder)}
          disabled={!selectedWorkOrder}
          className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
            ${selectedWorkOrder
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
