import { Wifi, Tv, Phone } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import { Breadcrumb } from './Breadcrumb';

interface ChangeServiceTypeProps {
  selectedSA?: Service | null;
  isMove2?: boolean;
  isAddLocation?: boolean;
  onBack: () => void;
  onNext: (serviceType: string) => void;
}

const SA_SERVICE_PILLS: Record<string, Record<string, string[]>> = {
  'sa-00912': {
    internet:   ['200 Mbps', 'Elite Wi-Fi', 'Tech Home Support'],
    television: ['iTV Preferred', 'Cinemax', 'FANatic'],
    phone:      ['Phone Bundle', 'LD Unlimited'],
  },
  'sa-01047': {
    internet:   ['200 Mbps'],
    television: [],
    phone:      ['Phone Bundle'],
  },
  'sa-02031': {
    internet:   [],
    television: [],
    phone:      ['Phone Standalone'],
  },
};

const SPECIAL_PILL_STYLE: Record<string, string> = {
  'Phone Standalone': 'bg-teal-100 text-teal-700',
};

const SERVICE_PILL_COLOR: Record<string, string> = {
  internet:   'bg-blue-100 text-blue-700',
  television: 'bg-purple-100 text-purple-700',
  phone:      'bg-green-100 text-green-700',
};

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

export function ChangeServiceType({ selectedSA, isMove2 = false, isAddLocation = false, onBack, onNext }: ChangeServiceTypeProps) {
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
      <Breadcrumb
        steps={(isMove2 || isAddLocation)
          ? ['Select account', 'Destination', 'Service type', 'Plan', 'Installation', 'Review order']
          : ['Select account', 'Service type', 'Plan', 'Installation', 'Review order']}
        currentIndex={(isMove2 || isAddLocation) ? 2 : 1}
      />

      {/* Service type cards */}
      <div className="grid grid-cols-3 gap-0 rounded-2xl border border-gray-200 overflow-hidden mb-10">
        {SERVICE_TYPES.map((svc, i) => {
          const Icon = svc.icon;
          const isSelected = selected === svc.id;
          const isDisabled = isAddLocation && svc.id === 'television';
          const pills = SA_SERVICE_PILLS[selectedSA?.id ?? '']?.[svc.id] ?? [];
          return (
            <button
              key={svc.id}
              onClick={() => { if (!isDisabled) setSelected(svc.id); }}
              disabled={isDisabled}
              className={`flex flex-col gap-4 p-8 text-left transition-all
                ${i > 0 ? 'border-l border-gray-200' : ''}
                ${isDisabled
                  ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-inset ring-blue-500'
                    : 'bg-white hover:bg-gray-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${svc.iconBg}`}>
                <Icon className={`w-6 h-6 ${svc.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-gray-900 mb-2">{svc.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{svc.description}</p>
                {isDisabled ? (
                  <span className="text-xs text-gray-400 italic">Requires internet service first</span>
                ) : pills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {pills.map(pill => (
                      <span
                        key={pill}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${SPECIAL_PILL_STYLE[pill] ?? SERVICE_PILL_COLOR[svc.id]}`}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No current service</span>
                )}
              </div>
              {/* Radio */}
              {!isDisabled && (
                <div className={`self-end w-4 h-4 rounded-full border-2 flex items-center justify-center mt-auto
                  ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
              )}
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
