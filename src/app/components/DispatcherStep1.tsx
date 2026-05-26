import React, { useState } from 'react';
import { MinusCircle, RefreshCw, XCircle, Settings, MapPin } from 'lucide-react';

export type MACDAction = 'deactivate' | 'reactivate' | 'disconnect' | 'change' | 'move';

interface DispatcherStep1Props {
  onNext: (action: MACDAction) => void;
  onCancel: () => void;
}

const actions: {
  id: MACDAction;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  selectedBorder: string;
  selectedBg: string;
  radioDot: string;
  radioRing: string;
  labelColor: string;
  fullWidth?: boolean;
  badge?: string;
}[] = [
  {
    id: 'deactivate',
    label: 'Deactivate',
    description: 'Temporarily suspend service. The account remains intact and can be reactivated at any time.',
    icon: MinusCircle,
    iconColor: 'text-amber-800',
    iconBg: 'bg-amber-50',
    selectedBorder: 'border-amber-400',
    selectedBg: 'bg-amber-50',
    radioDot: 'bg-amber-800',
    radioRing: 'border-amber-800',
    labelColor: 'text-amber-800',
  },
  {
    id: 'reactivate',
    label: 'Reactivate',
    description: 'Restore a previously deactivated service. Billing and service will resume immediately.',
    icon: RefreshCw,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    selectedBorder: 'border-green-600',
    selectedBg: 'bg-green-50',
    radioDot: 'bg-green-600',
    radioRing: 'border-green-600',
    labelColor: 'text-green-700',
  },
  {
    id: 'disconnect',
    label: 'Disconnect',
    description: 'Permanently terminate service. This action cannot be undone and will close the service account.',
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    selectedBorder: 'border-red-500',
    selectedBg: 'bg-red-50',
    radioDot: 'bg-red-500',
    radioRing: 'border-red-500',
    labelColor: 'text-red-700',
  },
  {
    id: 'change',
    label: 'Change',
    description: 'Modify an existing service. Update plan, features, or configuration without interrupting service.',
    icon: Settings,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
    radioDot: 'bg-blue-500',
    radioRing: 'border-blue-500',
    labelColor: 'text-blue-700',
  },
  {
    id: 'move',
    label: 'Move',
    description: 'Transfer services to a new address. Supports M01 / M02 / M03.',
    icon: MapPin,
    iconColor: 'text-[#800080]',
    iconBg: 'bg-[#f3e8f3]',
    selectedBorder: 'border-[#800080]',
    selectedBg: 'bg-[#faf0fa]',
    radioDot: 'bg-[#800080]',
    radioRing: 'border-[#800080]',
    labelColor: 'text-[#800080]',
    fullWidth: true,
  },
];

export function DispatcherStep1({ onNext, onCancel }: DispatcherStep1Props) {
  const [selected, setSelected] = useState<MACDAction | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Manage service</h1>
        <p className="text-gray-600">
          Select the action you want to perform on{' '}
          <span className="font-semibold">Robert Johnson</span>'s{' '}
          <span className="font-semibold">ACC-004821</span> Residential account.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selected === action.id;
          return (
            <button
              key={action.id}
              onClick={() => setSelected(action.id)}
              className={`flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all
                ${action.fullWidth ? 'col-span-2' : ''}
                ${isSelected
                  ? `${action.selectedBorder} ${action.selectedBg}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                {action.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {action.badge}
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${isSelected ? action.labelColor : 'text-gray-800'}`}>
                {action.label}
              </span>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">
                {action.description}
              </p>
              {/* Radio */}
              <div className={`self-end w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isSelected ? action.radioRing : 'border-gray-300'}`}>
                {isSelected && (
                  <div className={`w-2 h-2 rounded-full ${action.radioDot}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-7 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Cancel
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
