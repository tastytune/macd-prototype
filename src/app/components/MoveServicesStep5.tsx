import { ChevronRight, Check } from 'lucide-react';
import type { Service } from '../App';

interface MoveServicesStep5Props {
  scenario: string;
  selectedSA?: Service | null;
  destinationAddress: string;
  selectedServiceIds: string[];
  billingEndDate: string;
  installationDate: string;
  onBack: () => void;
  onSubmit: () => void;
}

const MOVE_STEPS = ['Account', 'Destination', 'Services', 'Dates', 'Review'];
const CURRENT_STEP = 4;

const ALL_SERVICES = [
  { id: 'fiber',     name: 'Fiber Internet 1 Gbps', price: 79.99 },
  { id: 'voice',     name: 'Voice (217) 555-0148',  price: 19.99 },
  { id: 'streaming', name: 'Streaming TV',           price: 15.00 },
  { id: 'wifi',      name: 'WiFi equipment',         price: 10.00 },
];

const MOVE_TYPE_LABEL: Record<string, string> = {
  M01: 'M01 — Full move',
  M02: 'M02 — Partial move',
  M03: 'M03 — Technology change',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function MoveServicesStep5({
  scenario,
  selectedSA,
  destinationAddress,
  selectedServiceIds,
  billingEndDate,
  installationDate,
  onBack,
  onSubmit,
}: MoveServicesStep5Props) {
  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const originAddress = selectedSA?.address ?? '742 Evergreen Terrace, Springfield, IL 62701';
  const technology = scenario === 'M03' ? 'Fiber → Coax (technology change)' : 'Fiber → Fiber (no change)';
  const newMRC = ALL_SERVICES.filter(s => selectedServiceIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0);
  const orderMgmt = scenario === 'M03'
    ? [
        { label: 'FSL work order',  value: 'Auto-generated on submit' },
        { label: 'Tech change KDD', value: 'Fiber removal + coax activation' },
        { label: 'IDI sync',        value: 'Billing end date will sync' },
        { label: 'Customer email',  value: 'Sent on submit' },
      ]
    : [
        { label: 'FSL work order',   value: 'Auto-generated on submit' },
        { label: 'Follow-on KDD-35', value: 'Temp → buried (auto)' },
        { label: 'IDI sync',         value: 'Billing end date will sync' },
        { label: 'Customer email',   value: 'Sent on submit' },
      ];

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 mb-6 text-sm flex-wrap">
        {MOVE_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <span className={
              i < CURRENT_STEP
                ? 'font-semibold text-blue-600'
                : i === CURRENT_STEP
                ? 'font-semibold text-gray-900'
                : 'text-gray-400'
            }>
              {step}
            </span>
          </span>
        ))}
      </nav>

      {/* Context bar */}
      <div className="flex items-stretch rounded-xl border border-[#d9a0d9] bg-[#faf0fa] overflow-hidden mb-8 text-sm">
        <div className="flex items-center px-4 py-3 bg-[#f3e8f3] border-r border-[#d9a0d9]">
          <span className="text-xs font-bold tracking-widest uppercase text-[#800080]">Moving</span>
        </div>
        <div className="flex items-center px-5 py-3 border-r border-[#d9a0d9]">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Customer</p>
            <p className="font-medium text-gray-900">Robert Johnson · ACC-004821</p>
          </div>
        </div>
        <div className="flex items-center px-5 py-3 border-r border-[#d9a0d9]">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Service account</p>
            <p className="font-medium text-gray-900">{saName}</p>
          </div>
        </div>
        <div className="flex items-center px-5 py-3">
          <div>
            <p className="text-xs text-[#9a4a9a] mb-0.5">Origin</p>
            <p className="font-medium text-gray-900">{originAddress}</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Review &amp; confirm</h2>
        <p className="text-sm text-gray-500 mb-8">Verify all details. A confirmation email will be sent to the customer.</p>

        {/* MOVE SUMMARY */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Move summary</p>
        <div className="flex flex-col gap-2.5 mb-6">
          {[
            { label: 'Move type',       value: MOVE_TYPE_LABEL[scenario] ?? scenario },
            { label: 'Customer',        value: 'Robert Johnson · ACC-004821' },
            { label: 'Service account', value: saName },
            { label: 'Origin',          value: originAddress },
            { label: 'Destination',     value: destinationAddress || '—' },
            { label: 'Technology',      value: technology },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-2 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>
        <hr className="border-gray-200 mb-6" />

        {/* SERVICES */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Services</p>
        <div className="flex flex-col gap-2.5 mb-6">
          {ALL_SERVICES.map(svc => {
            const isMoving = selectedServiceIds.includes(svc.id);
            return (
              <div key={svc.id} className="grid grid-cols-2 text-sm">
                <span className="text-gray-500">{svc.name}</span>
                <span className={isMoving ? 'text-gray-900' : 'text-red-600'}>
                  {isMoving ? `Moving · $${svc.price.toFixed(2)}/mo` : 'Disconnecting'}
                </span>
              </div>
            );
          })}
        </div>
        <hr className="border-gray-200 mb-6" />

        {/* DATES & BILLING */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Dates &amp; billing</p>
        <div className="flex flex-col gap-2.5 mb-6">
          {[
            { label: 'Billing end (old)',   value: formatDate(billingEndDate) },
            { label: 'Installation (new)',  value: formatDate(installationDate) },
            { label: 'New MRC',             value: `$${newMRC.toFixed(2)}/mo` },
            { label: 'Move fee (one-time)', value: '$65.00' },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-2 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>
        <hr className="border-gray-200 mb-6" />

        {/* ORDER MANAGEMENT */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Order management</p>
        <div className="flex flex-col gap-2.5 mb-8">
          {orderMgmt.map(row => (
            <div key={row.label} className="grid grid-cols-2 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-[#800080] text-white hover:bg-[#6a006a] transition-colors"
          >
            <Check className="w-4 h-4" />
            Submit move order
          </button>
        </div>
      </div>

    </div>
  );
}
