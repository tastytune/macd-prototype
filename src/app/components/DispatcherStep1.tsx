import React, { useState } from 'react';
import { Pause, Play, Power, RefreshCw, ClipboardList, MapPinPlus } from 'lucide-react';

function MovePinsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 30" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow under front pin */}
      <ellipse cx="17" cy="28.5" rx="4.5" ry="1.4" fill="currentColor" opacity="0.25"/>
      {/* Back small pin */}
      <path d="M8,4 C5.8,4 4,5.8 4,8 C4,10.8 8,14.5 8,14.5 C8,14.5 12,10.8 12,8 C12,5.8 10.2,4 8,4 Z"
            fill="white" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="1.9" fill="currentColor"/>
      {/* Front large pin */}
      <path d="M17,11 C13.7,11 11,13.7 11,17 C11,21.2 17,27.2 17,27.2 C17,27.2 23,21.2 23,17 C23,13.7 20.3,11 17,11 Z"
            fill="white" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="17" cy="17" r="3.2" fill="currentColor"/>
    </svg>
  );
}

export type MACDAction = 'deactivate' | 'reactivate' | 'disconnect' | 'change' | 'move' | 'move2' | 'followOnOrder' | 'addLocation';

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
    label: 'Temporary Disconnect',
    description: 'Temporarily suspend services. The account remains intact and can be reactivated at any time.',
    icon: Pause,
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
    label: 'Reconnect',
    description: 'Restore a previously deactivated service. Billing and service will resume immediately.',
    icon: Play,
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
    icon: Power,
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
    label: 'Change and Add New Service',
    description: 'Modify an existing service or add a new service to an existing customer. Update plan, features, or configuration without interrupting service.',
    icon: RefreshCw,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    selectedBorder: 'border-blue-500',
    selectedBg: 'bg-blue-50',
    radioDot: 'bg-blue-500',
    radioRing: 'border-blue-500',
    labelColor: 'text-blue-700',
  },
  {
    id: 'move2',
    label: 'Move',
    description: 'Transfer services to a new address.',
    icon: MovePinsIcon,
    iconColor: 'text-[#800080]',
    iconBg: 'bg-[#f3e8f3]',
    selectedBorder: 'border-[#800080]',
    selectedBg: 'bg-[#faf0fa]',
    radioDot: 'bg-[#800080]',
    radioRing: 'border-[#800080]',
    labelColor: 'text-[#800080]',
  },
  {
    id: 'followOnOrder',
    label: 'On-Site Upsell',
    description: 'Create a new order linked to this account that will be executed after the current one.',
    icon: ClipboardList,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    selectedBorder: 'border-indigo-500',
    selectedBg: 'bg-indigo-50',
    radioDot: 'bg-indigo-500',
    radioRing: 'border-indigo-500',
    labelColor: 'text-indigo-700',
  },
  {
    id: 'addLocation',
    label: 'Add On New Location',
    description: 'Add a new service location under this customer, alongside their existing accounts.',
    icon: MapPinPlus,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    selectedBorder: 'border-teal-500',
    selectedBg: 'bg-teal-50',
    radioDot: 'bg-teal-500',
    radioRing: 'border-teal-500',
    labelColor: 'text-teal-700',
  },
];

export function DispatcherStep1({ onNext, onCancel }: DispatcherStep1Props) {
  const [selected, setSelected] = useState<MACDAction | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">Manage Services</h1>
        <p className="text-gray-600 text-sm">
          Select the action you want to perform on{' '}
          <span className="font-semibold">Robert Johnson</span>'s{' '}
          <span className="font-semibold">ACC-004821</span> Residential account.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selected === action.id;

          if (action.fullWidth) {
            return (
              <button
                key={action.id}
                onClick={() => setSelected(action.id)}
                className={`col-span-2 flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? `${action.selectedBorder} ${action.selectedBg}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                  <Icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${isSelected ? action.labelColor : 'text-gray-800'}`}>
                    {action.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                </div>
                <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? action.radioRing : 'border-gray-300'}`}>
                  {isSelected && <div className={`w-2 h-2 rounded-full ${action.radioDot}`} />}
                </div>
              </button>
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => setSelected(action.id)}
              className={`flex flex-col gap-2.5 p-4 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? `${action.selectedBorder} ${action.selectedBg}`
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                  <Icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <span className={`text-sm font-semibold ${isSelected ? action.labelColor : 'text-gray-800'}`}>
                  {action.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">
                {action.description}
              </p>
              <div className={`self-end w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isSelected ? action.radioRing : 'border-gray-300'}`}>
                {isSelected && <div className={`w-2 h-2 rounded-full ${action.radioDot}`} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
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
