import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';

interface MoveServicesStep4Props {
  scenario: string;
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: (billingEnd: string, installation: string) => void;
}

const MOVE_STEPS = ['Account', 'Destination', 'Services', 'Dates', 'Review'];
const CURRENT_STEP = 3;

export function MoveServicesStep4({ scenario, selectedSA, onBack, onNext }: MoveServicesStep4Props) {
  const [billingEndDate, setBillingEndDate] = useState('');
  const [installationDate, setInstallationDate] = useState('');

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';
  const originAddress = selectedSA?.address ?? '742 Evergreen Terrace, Springfield, IL 62701';

  const installHint = scenario === 'M03'
    ? 'Min: 15 business days (technology change).'
    : 'Min: 10 business days (buried drop).';

  const canProceed = billingEndDate !== '' && installationDate !== '';

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
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Dates &amp; schedule</h2>

        {/* Date fields */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Billing end date (old address)
            </label>
            <input
              type="date"
              value={billingEndDate}
              onChange={e => setBillingEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-400">Date customer vacates. Billing stops here.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Installation date (new address)
            </label>
            <input
              type="date"
              value={installationDate}
              onChange={e => setInstallationDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-400">{installHint}</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* Move fee */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Move fee</p>
        <div className="flex items-start justify-between px-5 py-4 rounded-xl border border-gray-200 bg-gray-50">
          <div>
            <p className="text-sm font-semibold text-gray-900">Standard move fee</p>
            <p className="text-xs text-gray-500 mt-0.5">Applied to all moves. Credit on request in competitive areas.</p>
          </div>
          <span className="text-sm font-bold text-gray-900 flex-shrink-0 ml-6">$65.00</span>
        </div>

        {/* Navigation */}
        <div className="flex justify-end gap-3 mt-10">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onNext(billingEndDate, installationDate)}
            disabled={!canProceed}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors
              ${canProceed
                ? 'bg-[#800080] text-white hover:bg-[#6a006a]'
                : 'bg-[#c9a0c9] text-white cursor-not-allowed'
              }`}
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
