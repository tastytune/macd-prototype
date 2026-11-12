import { useState } from 'react';
import { Info } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

// ── Mock data ────────────────────────────────────────────────────────────────
// Front-end prototype only: in production this comes from the account's order list.
//
// OPEN DECISION: the list is scoped to the CURRENT account only. Whether to also show orders
// from other accounts (with an account flag/column) is still undecided.

export type AmendableOrderType = 'Change' | 'Move' | 'Disconnect' | 'Add additional location';
export type AmendableOrderStatus = 'In progress' | 'Completed' | 'Cancelled';

export interface AmendableOrder {
  id: string;
  orderNumber: string;
  type: AmendableOrderType;
  account: string;                 // account number the order belongs to
  status: AmendableOrderStatus;
  createdDate: string;             // display string (mock)
  pastPointOfNoReturn: boolean;    // in progress, but fulfilment can no longer be amended
  // Service account the cloned (supplemental) order is preloaded with.
  saId: string;
  saLabel: string;
  address: string;
}

export const MOCK_AMENDABLE_ORDERS: AmendableOrder[] = [
  {
    id: 'ord-20431', orderNumber: 'ORD-20431', type: 'Change', account: 'ACC-004821',
    status: 'In progress', createdDate: 'Oct 1, 2026', pastPointOfNoReturn: false,
    saId: 'SA-00912', saLabel: 'Primary residence', address: '412 Oak Ave, Lincoln, NE 68501',
  },
  {
    // Move: only the move-in order can be amended (see TODO in App.tsx).
    id: 'ord-20457', orderNumber: 'ORD-20457', type: 'Move', account: 'ACC-004821',
    status: 'In progress', createdDate: 'Oct 3, 2026', pastPointOfNoReturn: false,
    saId: 'SA-01047', saLabel: 'Move-in address', address: '88 Maple St, Lincoln, NE 68502',
  },
  {
    id: 'ord-20402', orderNumber: 'ORD-20402', type: 'Change', account: 'ACC-004821',
    status: 'In progress', createdDate: 'Sep 28, 2026', pastPointOfNoReturn: true,
    saId: 'SA-00912', saLabel: 'Primary residence', address: '412 Oak Ave, Lincoln, NE 68501',
  },
  {
    id: 'ord-20388', orderNumber: 'ORD-20388', type: 'Disconnect', account: 'ACC-004821',
    status: 'Completed', createdDate: 'Sep 15, 2026', pastPointOfNoReturn: false,
    saId: 'SA-02031', saLabel: 'Phone line', address: '17 Pine Rd, Lincoln, NE 68503',
  },
  {
    id: 'ord-20376', orderNumber: 'ORD-20376', type: 'Change', account: 'ACC-004821',
    status: 'Cancelled', createdDate: 'Sep 9, 2026', pastPointOfNoReturn: false,
    saId: 'SA-00912', saLabel: 'Primary residence', address: '412 Oak Ave, Lincoln, NE 68501',
  },
];

/** Returns why an order cannot be amended, or null when it can. */
function getBlockedReason(order: AmendableOrder): string | null {
  if (order.status !== 'In progress') return `${order.status} orders cannot be amended`;
  if (order.pastPointOfNoReturn) return 'Past point of no return, cannot be amended';
  return null;
}

// Same colour language as the action badges in ContextBar.
const TYPE_BADGE: Record<AmendableOrderType, string> = {
  Change: 'bg-blue-50 text-blue-700',
  Move: 'bg-[#f3e8f3] text-[#800080]',
  Disconnect: 'bg-red-50 text-red-700',
  'Add additional location': 'bg-teal-50 text-teal-700',
};

const STATUS_BADGE: Record<AmendableOrderStatus, string> = {
  'In progress': 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-gray-100 text-gray-600 border-gray-200',
  Cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface AmendOrderSelectProps {
  onBack: () => void;
  onNext: (order: AmendableOrder) => void;
}

export function AmendOrderSelect({ onBack, onNext }: AmendOrderSelectProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = MOCK_AMENDABLE_ORDERS.find(o => o.id === selectedId) ?? null;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">Amend In-Flight Order</h1>
        <p className="text-gray-600 text-sm">
          Select the order you want to amend on{' '}
          <span className="font-semibold">Robert Johnson</span>'s{' '}
          <span className="font-semibold">ACC-004821</span> Residential account.
        </p>
      </div>
      <Breadcrumb steps={['Select order', 'Service type', 'Plan', 'Installation', 'Review order']} currentIndex={0} variant="plain" />

      {/* Orders table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-4">
        <table className="w-full text-sm" aria-label="Orders on this account">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Select</span></th>
              <th scope="col" className="px-4 py-3">Order number</th>
              <th scope="col" className="px-4 py-3">Order type</th>
              <th scope="col" className="px-4 py-3">Account</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AMENDABLE_ORDERS.map(order => {
              const blockedReason = getBlockedReason(order);
              const disabled = blockedReason !== null;
              const isSelected = selectedId === order.id;
              const inputId = `amend-order-${order.id}`;
              const reasonId = `${inputId}-reason`;
              return (
                <tr
                  key={order.id}
                  aria-disabled={disabled}
                  aria-selected={isSelected}
                  title={blockedReason ?? undefined}
                  onClick={() => { if (!disabled) setSelectedId(order.id); }}
                  className={`border-b border-gray-100 last:border-b-0 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500
                    ${disabled
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : isSelected
                        ? 'bg-blue-50 cursor-pointer'
                        : 'bg-white hover:bg-gray-50 cursor-pointer'}`}
                >
                  <td className="px-4 py-3 align-top">
                    {/* aria-disabled (not `disabled`) keeps blocked rows focusable so screen-reader users hear why. */}
                    <input
                      id={inputId}
                      type="radio"
                      checked={isSelected}
                      aria-disabled={disabled}
                      aria-describedby={disabled ? reasonId : undefined}
                      aria-label={`Select order ${order.orderNumber}`}
                      onChange={() => { if (!disabled) setSelectedId(order.id); }}
                      className={`mt-0.5 w-4 h-4 accent-blue-600 focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{order.orderNumber}</span>
                    {disabled && (
                      <p id={reasonId} className="text-xs text-gray-500 mt-0.5">{blockedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[order.type]} ${disabled ? 'opacity-60' : ''}`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">{order.account}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_BADGE[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap">{order.createdDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 mb-6">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-px" />
        <span>
          {selected
            ? `A supplemental ${selected.type} order will be created from ${selected.orderNumber}. The original order is not modified.`
            : 'A supplemental order of the same type will be created from the order you select. The original order is not modified.'}
        </span>
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
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
            ${selected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
