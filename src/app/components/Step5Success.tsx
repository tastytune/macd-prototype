import { CheckCircle2, MapPin, Mail, ChevronDown, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import type { Service, OrderItem } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

const TIME_SLOT_LABELS: Record<string, string> = {
  'morning-1':   '8:00 AM – 10:00 AM',
  'morning-2':   '10:00 AM – 12:00 PM',
  'afternoon-1': '1:00 PM – 3:00 PM',
  'afternoon-2': '3:00 PM – 5:00 PM',
};

interface Step5Props {
  service: Service;
  orderReference: string;
  orderItems: OrderItem[];
  onReturn: () => void;
  action?: MACDAction | null;
  selectedSA?: Service | null;
  installationDate?: string;
  installationSlot?: string;
  billingEndDate?: string;
  timeSlot?: string;
  destinationAddress?: string;
}

const actionCopy: Record<string, { title: string; boldWord: string; bodyRest: string; bodyFull?: string; servicesList: string }> = {
  disconnect: {
    title: 'Disconnect Request Created',
    boldWord: 'disconnection',
    bodyRest: ' order request has been successfully created with reference number:',
    servicesList: 'Services to Be Disconnected',
  },
  reactivate: {
    title: 'Reactivation Request Created',
    boldWord: '',
    bodyRest: '',
    bodyFull: 'Reactivation request created. Reference number:',
    servicesList: 'Services to Be Reactivated',
  },
  deactivate: {
    title: 'Deactivation Request Created',
    boldWord: 'deactivation',
    bodyRest: ' order request has been successfully created with reference number:',
    servicesList: 'Services to Be Deactivated',
  },
  move: {
    title: 'Move Request Created',
    boldWord: 'move order',
    bodyRest: ' request has been successfully created with reference number:',
    servicesList: 'Services Being Moved',
  },
  move2: {
    title: 'Move Request Created',
    boldWord: 'move order',
    bodyRest: ' request has been successfully created with reference number:',
    servicesList: 'Services Being Moved',
  },
  change: {
    title: 'Change Request Created',
    boldWord: 'change',
    bodyRest: ' order request has been successfully created with reference number:',
    servicesList: 'Services Being Changed',
  },
};

export function Step5Success({ service, orderReference, orderItems, onReturn, action, selectedSA, installationDate, installationSlot, billingEndDate, timeSlot, destinationAddress }: Step5Props) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const groupedItems = orderItems.reduce((acc, item) => {
    if (!acc[item.serviceName]) {
      acc[item.serviceName] = [];
    }
    acc[item.serviceName].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  const isInternetDisconnected = action === 'disconnect';
  const isDeactivation = action === 'deactivate';
  const isChange = action === 'change';
  const copy = actionCopy[action ?? 'disconnect'] ?? actionCopy.disconnect;

  const formatDate = (ds: string) =>
    new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatDateWithDay = (ds: string) =>
    new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const isMove = action === 'move' || action === 'move2';

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Success Icon and Header */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl text-gray-900">{copy.title}</h1>
        </div>
      </div>
      <ContextBar action={action ?? null} selectedSA={selectedSA} />

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Important Notice */}
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {copy.bodyFull
                  ? <p className="text-gray-700 font-normal">{copy.bodyFull}</p>
                  : <p className="text-gray-700 font-normal">Your <strong>{copy.boldWord}</strong>{copy.bodyRest}</p>
                }
                <a href="https://salesforce.com/order/SF-2024-001234" target="_blank" rel="noopener noreferrer" className="block text-center text-blue-600 hover:text-blue-800 underline font-extralight text-xl pt-5">SF-2024-001234</a>
          </div>
        </div>

        {/* Key Dates — shown for Move */}
        {isMove && (installationDate || billingEndDate) && (
          <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
            {installationDate && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CalendarClock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Installation scheduled for{' '}
                  <strong>
                    {formatDateWithDay(installationDate)}
                    {(timeSlot || (installationSlot && TIME_SLOT_LABELS[installationSlot]))
                      ? `, ${timeSlot || TIME_SLOT_LABELS[installationSlot]}`
                      : ''}
                  </strong>
                  {destinationAddress ? <> at <strong>{destinationAddress}</strong></> : ''}.
                </p>
              </div>
            )}
            {billingEndDate && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <CalendarClock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Billing at origin address ends on <strong>{formatDateWithDay(billingEndDate)}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Installation date — shown for Change when a date was selected */}
        {isChange && installationDate && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Installation scheduled for <strong>{formatDate(installationDate)}</strong>
                {installationSlot && TIME_SLOT_LABELS[installationSlot] ? <>, <strong>{TIME_SLOT_LABELS[installationSlot]}</strong></> : ''}
                {selectedSA?.address ? <> at <strong>{selectedSA.address}</strong></> : ''}.
              </p>
            </div>
          </div>
        )}

        {/* Hardware Return Information - Only shown if Internet is being disconnected */}
        {isInternetDisconnected && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900 mb-2">Hardware Return Required</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Your Internet service disconnection includes equipment that must be returned within 5 days to avoid additional charges.
                  </p>
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-2">Return Options:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span><strong>Drop-off locations:</strong> Visit any authorized retail store location during business hours (Mon-Sat: 9AM-7PM, Sun: 10AM-6PM)</span>
                      </li>
                  
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span><strong>Schedule pickup:</strong> Call 1-800-555-0123 to schedule a free equipment pickup at your service address</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation confirmation notice */}
        {isDeactivation && (
          <div className="mb-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  The customer will receive a confirmation via email with the details of this request, including the scheduled deactivation date and affected services.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finish Button */}
      <div className="flex justify-center">
        <button
          onClick={onReturn}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Finish
        </button>
      </div>
    </div>
  );
}