import { useState } from 'react';
import { HardHat, Headset } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

export type FollowOnRequesterType = 'technician' | 'crc';

interface FollowOnRequesterTypeProps {
  onBack: () => void;
  onContinue: (requesterType: FollowOnRequesterType) => void;
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

export function FollowOnRequesterType({ onBack, onContinue }: FollowOnRequesterTypeProps) {
  const [selected, setSelected] = useState<FollowOnRequesterType | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <Breadcrumb
        steps={['Follow On Order', 'Serviceability', 'Service Type', 'Plan', 'Review Order', 'Confirmation']}
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

      {/* Requester type card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Who is creating this order?</h2>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`flex flex-col gap-2.5 p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center bg-indigo-50`}>
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
          onClick={() => selected && onContinue(selected)}
          disabled={!selected}
          className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
            ${selected
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
