import type { MACDAction } from './DispatcherStep1';
import type { Service } from '../App';

const actionBadgeStyle: Record<MACDAction, string> = {
  deactivate: 'bg-amber-50 text-amber-800',
  reactivate: 'bg-green-50 text-green-700',
  disconnect: 'bg-red-50 text-red-700',
  change: 'bg-blue-50 text-blue-700',
  move: 'bg-[#f3e8f3] text-[#800080]',
};

const actionLabel: Record<MACDAction, string> = {
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  disconnect: 'Disconnect',
  change: 'Change',
  move: 'Move',
};

interface ContextBarProps {
  action: MACDAction | null;
  selectedSA?: Service | null;
}

export function ContextBar({ action, selectedSA }: ContextBarProps) {
  if (!action) return null;
  return (
    <p className="text-gray-600 flex items-center gap-2 whitespace-nowrap mb-8 overflow-hidden text-ellipsis">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${actionBadgeStyle[action]}`}>
        {actionLabel[action]}
      </span>
      <span className="text-gray-400 shrink-0">·</span>
      <span className="text-gray-600 font-bold shrink-0">Robert Johnson</span>
      {selectedSA && (
        <>
          <span className="text-gray-400 shrink-0">·</span>
          <span className="font-medium text-gray-700 shrink-0">{selectedSA.name}</span>
          {selectedSA.address && (
            <>
              <span className="text-gray-400 shrink-0">·</span>
              <span className="text-gray-600 font-bold shrink-0">{selectedSA.address}</span>
            </>
          )}
        </>
      )}
    </p>
  );
}
