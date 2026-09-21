import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
  move: 'bg-[#f3e8f3] text-[#800080]',
  move2: 'bg-[#f3e8f3] text-[#800080]',
  followOnOrder: 'bg-indigo-50 text-indigo-700',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Temporary Disconnect',
  reactivate: 'Reconnect',
  disconnect: 'Disconnect',
  change: 'Change',
  move: 'Move',
  move2: 'Move',
  followOnOrder: 'Follow On Order',
};

interface ContextBarProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
}

export function ContextBar({ action, selectedSA }: ContextBarProps) {
  if (!action) return null;
  return (
    <div className="mb-8 flex items-center gap-2 min-w-0 overflow-hidden text-gray-600">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${actionBadgeStyle[action]}`}>
        {actionLabel[action]}
      </span>
      <span className="text-gray-400 flex-shrink-0">·</span>
      <span className="font-bold flex-shrink-0">Robert Johnson</span>
      {selectedSA && (
        <>
          <span className="text-gray-400 flex-shrink-0">·</span>
          <span className="font-medium text-gray-700 flex-shrink-0">{selectedSA.name}</span>
          {selectedSA.address && (
            <>
              <span className="text-gray-400 flex-shrink-0">·</span>
              <span className="text-gray-500 truncate min-w-0">{selectedSA.address}</span>
            </>
          )}
        </>
      )}
    </div>
  );
}
