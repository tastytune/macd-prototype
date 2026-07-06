import { Wifi, Tv, Phone } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import { Breadcrumb } from './Breadcrumb';

interface ChangeServiceTypeProps {
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: (serviceType: string) => void;
}

const SERVICE_TYPES = [
  {
    id: 'internet',
    label: 'Internet',
    description: 'High-speed connectivity for your home',
    icon: Wifi,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'television',
    label: 'Television',
    description: 'Entertainment with hundreds of channels',
    icon: Tv,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'phone',
    label: 'Phone',
    description: 'Reliable home phone service',
    icon: Phone,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
];

export function ChangeServiceType({ selectedSA, onBack, onNext }: ChangeServiceTypeProps) {
  const isPhoneStandalone = selectedSA?.id === 'sa-02031';
  const [selected, setSelected] = useState<string | null>(isPhoneStandalone ? 'phone' : null);

  const saName = selectedSA?.name ?? 'SA-00912 · Primary residence';

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">What would you like to change?</h1>
        <p className="text-gray-500 text-sm">
          Account: <span className="font-medium text-gray-700">Robert Johnson · ACC-004821</span>
          <span className="mx-2 text-gray-300">·</span>
          Service account: <span className="font-medium text-gray-700">{saName}</span>
        </p>
      </div>
      <Breadcrumb steps={['Select account', 'Service type', 'Plan', 'Installation', 'Review order']} currentIndex={1} />

      {/* Service type cards */}
      <div className="grid grid-cols-3 gap-0 rounded-2xl border border-gray-200 overflow-hidden mb-10">
        {SERVICE_TYPES.map((svc, i) => {
          const Icon = svc.icon;
          const isSelected = selected === svc.id;
          return (
            <button
              key={svc.id}
              onClick={() => setSelected(svc.id)}
              className={`flex flex-col gap-4 p-8 text-left transition-all
                ${i > 0 ? 'border-l border-gray-200' : ''}
                ${isSelected
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-inset ring-blue-500'
                  : 'bg-white hover:bg-gray-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${svc.iconBg}`}>
                <Icon className={`w-6 h-6 ${svc.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">{svc.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{svc.description}</p>
              </div>
              {/* Radio */}
              <div className={`self-end w-4 h-4 rounded-full border-2 flex items-center justify-center mt-auto
                ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
            </button>
          );
        })}
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
