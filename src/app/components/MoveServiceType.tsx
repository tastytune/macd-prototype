import { Wifi, Tv, Phone } from 'lucide-react';
import { useState } from 'react';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface MoveServiceTypeProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
  onBack: () => void;
  onNext: (serviceIds: string[]) => void;
}

const SA_SERVICE_GROUPS: Record<string, { type: string; serviceIds: string[] }[]> = {
  'sa-00912': [
    { type: 'internet',   serviceIds: ['internet']                  },
    { type: 'television', serviceIds: ['itv', 'cinemax', 'fanatic'] },
  ],
  'sa-01047': [
    { type: 'internet', serviceIds: ['internet-200m'] },
    { type: 'phone',    serviceIds: ['phone-bundle']  },
  ],
  'sa-02031': [
    { type: 'phone', serviceIds: ['phone-bundle'] },
  ],
};

const DEFAULT_SERVICE_GROUPS = SA_SERVICE_GROUPS['sa-00912'];

const SERVICE_TYPE_CARDS = [
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

export function MoveServiceType({ action, selectedSA, onBack, onNext }: MoveServiceTypeProps) {
  const saGroups = SA_SERVICE_GROUPS[selectedSA?.id ?? ''] ?? DEFAULT_SERVICE_GROUPS;
  const availableTypes = new Set(saGroups.map(g => g.type));
  const [selected, setSelected] = useState<Set<string>>(new Set(availableTypes));

  const visibleCards = SERVICE_TYPE_CARDS.filter(c => availableTypes.has(c.id));
  const colsClass =
    visibleCards.length === 1 ? 'grid-cols-1' :
    visibleCards.length === 2 ? 'grid-cols-2' :
    'grid-cols-3';

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    const ids = saGroups
      .filter(g => selected.has(g.type))
      .flatMap(g => g.serviceIds);
    onNext(ids);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">What would you like to move?</h1>
        <ContextBar action={action} selectedSA={selectedSA} />
      </div>
      <Breadcrumb
        steps={['Select account', 'Destination', 'Services', 'Schedule', 'Review order']}
        currentIndex={2}
      />

      <div className={`grid ${colsClass} gap-0 rounded-2xl border border-gray-200 overflow-hidden mb-10`}>
        {visibleCards.map((svc, i) => {
          const Icon = svc.icon;
          const isSelected = selected.has(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => toggle(svc.id)}
              className={`flex flex-col gap-4 p-8 text-left transition-all
                ${i > 0 ? 'border-l border-gray-200' : ''}
                ${isSelected
                  ? 'bg-blue-50 ring-2 ring-inset ring-blue-500'
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
              {/* Square checkbox = multi-select */}
              <div className={`self-end w-4 h-4 rounded border-2 flex items-center justify-center mt-auto
                ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selected.size === 0}
          className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-colors
            ${selected.size > 0
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
