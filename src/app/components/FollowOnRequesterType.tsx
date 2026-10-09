import { useState } from 'react';
import { HardHat, Headset, CheckCircle2, AlertTriangle, Info, ListPlus } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { MOCK_WORK_ORDERS, searchWorkOrders } from './FollowOnWorkOrder';
import type { WorkOrderResult } from './FollowOnWorkOrder';

export type FollowOnRequesterType = 'technician' | 'crc';

interface FollowOnRequesterTypeProps {
  onBack: () => void;
  onContinue: (requesterType: FollowOnRequesterType, workOrder: WorkOrderResult, addToExistingFollowOn: boolean) => void;
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

/** Read-only "Order in progress" context card shared by the Technician and CRC paths (RFBP1-1534). */
function OrderInProgressCard({ wo, notInProgress = false }: { wo: WorkOrderResult; notInProgress?: boolean }) {
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {notInProgress ? 'Original order' : 'Order in progress'}
          </p>
          <a
            href={`https://salesforce.com/order/${wo.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-blue-600 hover:text-blue-800 underline mt-0.5 inline-block"
          >
            {wo.orderNumber}
          </a>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap border
            ${notInProgress
              ? 'bg-gray-100 text-gray-600 border-gray-200'
              : 'bg-amber-100 text-amber-700 border-amber-200'}`}
        >
          {wo.orderStatus} / {wo.orderSubStatus}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-gray-400">Products on this order</dt>
          <dd className="text-gray-800 font-medium mt-0.5">{wo.products.join(', ')}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">Service account</dt>
          <dd className="text-gray-800 font-medium mt-0.5">{wo.saId} · {wo.saLabel}</dd>
          <dd className="text-xs text-gray-500 mt-0.5">{wo.address}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-px" />
        <span>A separate order will be created. This order is not modified.</span>
      </div>
    </div>
  );
}

export function FollowOnRequesterType({ onBack, onContinue }: FollowOnRequesterTypeProps) {
  const [selected, setSelected] = useState<FollowOnRequesterType | null>(null);

  // Technician-only: Work Order lookup
  const [workOrderId, setWorkOrderId] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<WorkOrderResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // RFBP1-1542: the technician chose to add to the already-open follow-on instead of creating another.
  const [addToExisting, setAddToExisting] = useState(false);

  // CRC: pick the service account that has the order in progress (mock: the demo account).
  const crcAccount = MOCK_WORK_ORDERS[0];
  const [crcAccountSelected, setCrcAccountSelected] = useState(false);

  const isValid = workOrderId.trim().length > 0;
  const selectedWorkOrder = results.find(wo => wo.id === selectedId) ?? null;

  // RFBP1-1534: a follow-on can only hang off an original order that is still in progress.
  const orderNotInProgress = !!selectedWorkOrder && selectedWorkOrder.orderStatus !== 'In Progress';
  const openFollowOn = selectedWorkOrder?.openFollowOn ?? null;

  const handleValidate = () => {
    if (!isValid || searchState === 'searching') return;
    setSelectedId(null);
    setAddToExisting(false);
    setSearchState('searching');
    setTimeout(() => {
      setResults(searchWorkOrders(workOrderId));
      setSearchState('results');
    }, 500);
  };

  const handleSelectOption = (optionId: FollowOnRequesterType) => {
    setSelected(optionId);
    if (optionId === 'crc') {
      setCrcAccountSelected(true);
      // CRC never looks up a work order — clear any in-progress Technician lookup state.
      setWorkOrderId('');
      setSearchState('idle');
      setResults([]);
      setSelectedId(null);
      setAddToExisting(false);
    }
  };

  const canContinue =
    (selected === 'crc' && crcAccountSelected) ||
    (selected === 'technician' && !!selectedWorkOrder && !orderNotInProgress && (!openFollowOn || addToExisting));

  const handleContinue = () => {
    if (selected === 'crc' && crcAccountSelected) {
      onContinue('crc', crcAccount, false);
    } else if (selected === 'technician' && selectedWorkOrder && !orderNotInProgress) {
      onContinue('technician', selectedWorkOrder, !!openFollowOn && addToExisting);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <Breadcrumb
        steps={['Follow-On Order', 'Service Type', 'Plan', 'Review Order', 'Confirmation']}
        currentIndex={0}
        variant="plain"
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Follow On Order</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
            Follow-On Order
          </span>
          {selected === 'technician' && selectedWorkOrder && (
            <span
              title="Original order — read-only context"
              className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap cursor-default"
            >
              Original order · {selectedWorkOrder.orderNumber}
            </span>
          )}
        </div>
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

        {/* CRC-only: service account + its order in progress */}
        {selected === 'crc' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select the service account</h2>

            <button
              role="radio"
              aria-checked={crcAccountSelected}
              onClick={() => setCrcAccountSelected(true)}
              className={`w-full flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all
                ${crcAccountSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{crcAccount.saId} - {crcAccount.orderNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">{crcAccount.address}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {crcAccount.products.map(product => (
                    <span key={product} className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                  {crcAccount.orderStatus}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${crcAccountSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                  {crcAccountSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
              </div>
            </button>

            {crcAccountSelected && <OrderInProgressCard wo={crcAccount} />}
          </div>
        )}

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

            <p className="mt-2 text-xs text-gray-400">
              Prototype demo: WO-10432 (in progress) · WO-10388 (order completed) · WO-10455 (open follow-on)
            </p>

            {/* Search results */}
            {searchState === 'results' && (
              <div className="mt-6 space-y-3">
                {results.map((wo) => {
                  const isSelectedWo = selectedId === wo.id;
                  return (
                    <button
                      key={wo.id}
                      onClick={() => { setSelectedId(wo.id); setAddToExisting(false); }}
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

            {/* Order in progress — read-only context (RFBP1-1534) */}
            {selectedWorkOrder && (
              <OrderInProgressCard wo={selectedWorkOrder} notInProgress={orderNotInProgress} />
            )}

            {/* Blocked: original order no longer in progress (RFBP1-1534) */}
            {orderNotInProgress && selectedWorkOrder && (
              <div className="mt-4 flex items-start gap-3 px-5 py-4 rounded-xl border border-red-200 bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-red-800">Can’t continue — the original order is no longer in progress</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    {selectedWorkOrder.orderNumber} is {selectedWorkOrder.orderStatus.toLowerCase()}. A follow-on order can only be
                    created while the original installation order is in progress.
                  </p>
                </div>
              </div>
            )}

            {/* Existing open follow-on, not started → offer to add instead of creating another (RFBP1-1542) */}
            {!orderNotInProgress && openFollowOn && (
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <ListPlus className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      A follow-on order is already open: {openFollowOn.id}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {openFollowOn.status} · {openFollowOn.products.join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Add the new upsell to this order instead of creating another follow-on.
                    </p>
                  </div>
                  <button
                    onClick={() => setAddToExisting(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0
                      ${addToExisting
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {addToExisting ? 'Adding to this order' : 'Add to this order'}
                  </button>
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
