import { User, Mail, Smartphone } from 'lucide-react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface AddLocationCustomerDetailsProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: () => void;
}

// Read-only account holder details — inherited from the existing account,
// not collected here. Shown as output for the CRC to confirm, not edited.
const CUSTOMER_DETAILS = {
  firstName: 'Robert',
  lastName: 'Johnson',
  email: 'robert.johnson@example.com',
  mobile: '(217) 555-0148',
};

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-900">
        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {value}
      </div>
    </div>
  );
}

export function AddLocationCustomerDetails({ action, selectedSA, onBack, onNext }: AddLocationCustomerDetailsProps) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Add On New Location</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={['Select account', 'Destination', 'Customer details']}
        currentIndex={2}
      />

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Customer details</h2>
        <p className="text-sm text-gray-500 mb-8">
          Carried over from the existing account for the new service location.
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <DetailField icon={User} label="First name" value={CUSTOMER_DETAILS.firstName} />
            </div>
            <div className="flex-1">
              <DetailField icon={User} label="Last name" value={CUSTOMER_DETAILS.lastName} />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <DetailField icon={Mail} label="Email" value={CUSTOMER_DETAILS.email} />
            </div>
            <div className="flex-1">
              <DetailField icon={Smartphone} label="Mobile" value={CUSTOMER_DETAILS.mobile} />
            </div>
          </div>
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
            onClick={onNext}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#800080] text-white hover:bg-[#6a006a] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
