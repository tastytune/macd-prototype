import { useState } from 'react';
import { HardHat, Headset, CheckCircle2 } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { MOCK_WORK_ORDERS } from './FollowOnWorkOrder';
import type { WorkOrderResult } from './FollowOnWorkOrder';

export type FollowOnRequesterType = 'technician' | 'crc';

interface FollowOnRequesterTypeProps {
  onBack: () => void;
  onContinue: (requesterType: FollowOnRequesterType, workOrder: WorkOrderResult) => void;
}

const OPTIONS: {
  id: FollowOnRequesterType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'technician',
    label: 'Technician',
    description: 'An on-site technician is creating this follow-on order from an active work order.',
    icon: HardHat,
  },
  {
    id: 'crc',
    label: 'CRC',
    description: 'A Customer Response Center agent is creating this follow-on order on behalf of the customer.',
    icon: Headset,
  },
];

type SearchState = 'idle' | 'searching' | 'results';

export function FollowOnRequesterType({ onBack, onContinue }: FollowOnRequesterTypeProps) {
  const [selected, setSelected] = useState<FollowOnRequesterType | null>(null);

  // Technician-only: Work Order lookup
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

  const handleSelectOption = (optionId: FollowOnRequesterType) => {
    setSelected(optionId);
    if (optionId === 'crc') {
      // CRC never looks up a work order — clear any in-progress Technician lookup state.
      setWorkOrderId('');
      setSearchState('idle');
      setResults([]);
      setSelectedId(null);
    }
  };

  const canContinue = selected === 'crc' || (selected === 'technician' && !!selectedWorkOrder);

  const handleContinue = () => {
    if (selected === 'crc') {
      onContinue('crc', MOCK_WORK_ORDERS[0]);
    } else if (selected === 'technician' && selectedWorkOrder) {
      onContinue('technician', selectedWorkOrder);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <Breadcrumb
        steps={['On-Site Upsell', 'Service Type', 'Plan', 'Review Order', 'Confirmation']}
        currentIndex={0}
        variant="plain"
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Follow On Order</h1>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
          On-Site Upsell
        </span>
      </div>

      {/* Requester type + (Technician only) Work Order lookup */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Who is creating this order?</h2>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`flex flex-col gap-2.5 p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center bg-indigo-50">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {option.label}
                  </span>
                  <div className={`ml-auto flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-indigo-500' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            );
          })}
        </div>

        {/* Technician-only: Work Order lookup, shown inline once selected */}
        {selected === 'technician' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
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
                  const isSelectedWo = selectedId === wo.id;
                  return (
                    <button
                      key={wo.id}
                      onClick={() => setSelectedId(wo.id)}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border text-left transition-all
                        ${isSelectedWo
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
                          ${isSelectedWo ? 'border-blue-600' : 'border-gray-300'}`}>
                          {isSelectedWo && <div className="w-2 h-2 rounded-full bg-blue-600" />}
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
          onClick={handleContinue}
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
  );
}
