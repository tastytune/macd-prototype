import { Wifi, Phone, Tv, MonitorPlay, ChevronRight, ChevronDown, Anchor, Trash2, AlertCircle, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { DateInput } from './DateInput';
import type { Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';
import { ImageWithFallback } from './figma/ImageWithFallback';
import cinemaxLogo from 'figma:asset/e73cd34a93b6cf4ced24e49c0d27ef619f645480.png';
import hboLogo from 'figma:asset/8c729044885a4bab439320b910fb1e838b9186b5.png';
import showtimeLogo from 'figma:asset/e20d776efc891e951b92d58092d597a8a750aac0.png';
import starzLogo from 'figma:asset/a5513f252498124c13ee55ac36f45597dfc9a4e8.png';
import sportsTierLogo from 'figma:asset/6944db11e4b77188d75287c86024872fff886b94.png';
import fanaticLogo from '../../assets/fanatic-logo.svg';

function nextWeekday(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const dow = d.getDay();
  if (dow === 6) d.setDate(d.getDate() + 2);
  if (dow === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

interface AssetViewerProps {
  onNext?: (selectedServices: Service[], selectedChildItems: string[], disconnectionDate: string) => void;
  onBack?: () => void;
  action?: MACDAction | null;
  selectedSA?: Service | null;
  disconnectionReason?: string;
  disconnectionComments?: string;
  onReasonChange?: (reason: string) => void;
  onCommentsChange?: (comments: string) => void;
}

const SA_SERVICES: Record<string, Service[]> = {
  'sa-00912': [
    {
      id: 'internet',
      name: 'Residential Internet',
      status: 'Active',
      children: [
        { id: 'internet-assurance', name: 'Service Assurance', status: 'Active' },
        { id: 'internet-elitewifi', name: 'Elite Wi-fi', status: 'Active' },
      ]
    },
    {
      id: 'tv',
      name: 'iTV Preferred',
      status: 'Active',
      children: [
        { id: 'tv-broadcaster', name: 'Broadcaster Fee', status: 'Active' },
        { id: 'tv-connectivity', name: 'Connectivity Fee', status: 'Active' },
        { id: 'tv-music', name: 'Digital Music Channel', status: 'Active' },
        { id: 'tv-dvr', name: 'DVR Hours', status: 'Active' },
        { id: 'tv-streams', name: 'Number Of Streams', status: 'Active' },
        { id: 'tv-cinemax', name: 'Cinemax', status: 'Active' },
        { id: 'tv-fanatic', name: 'FANatic', status: 'Active' },
      ]
    },
  ],
  'sa-01047': [
    {
      id: 'internet',
      name: 'Residential Internet',
      status: 'Active',
      children: [
        { id: 'internet-assurance', name: 'Service Assurance', status: 'Active' },
      ]
    },
    {
      id: 'phone',
      name: 'Phone bundle',
      status: 'Active',
      children: [
        { id: 'phone-callwaiting', name: 'Call Waiting', status: 'Active' },
        { id: 'phone-callerid', name: 'Caller ID', status: 'Active' },
        { id: 'phone-voice', name: 'Voice', status: 'Active' },
        { id: 'phone-voicemail', name: 'Voice Mail', status: 'Active' },
        { id: 'phone-directory', name: 'Directory Listing', status: 'Active' },
        { id: 'phone-longdistance', name: 'Long Distance', status: 'Active' },
      ]
    },
  ],
};

const getServiceIcon = (serviceId: string) => {
  switch (serviceId) {
    case 'internet':
      return <Wifi className="w-5 h-5 text-gray-600" />;
    case 'phone':
      return <Phone className="w-5 h-5 text-gray-600" />;
    case 'tv':
      return <Tv className="w-5 h-5 text-gray-600" />;
    case 'streaming':
      return <MonitorPlay className="w-5 h-5 text-gray-600" />;
    default:
      return null;
  }
};

export function AssetViewer({ onNext, onBack, action, selectedSA, disconnectionReason = '', disconnectionComments = '', onReasonChange, onCommentsChange }: AssetViewerProps) {
  const services = SA_SERVICES[selectedSA?.id ?? ''] ?? SA_SERVICES['sa-00912'];
  const dependentServiceNames = services.filter(s => s.id !== 'internet').map(s => s.name).join(' and ');

  const today = new Date().toISOString().split('T')[0];
  const defaultDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return nextWeekday(d.toISOString().split('T')[0]);
  })();
  const [disconnectionDate, setDisconnectionDate] = useState(defaultDate);

  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleExpand = (serviceId: string) => {
    if (expanded.includes(serviceId)) {
      setExpanded(expanded.filter(id => id !== serviceId));
    } else {
      setExpanded([...expanded, serviceId]);
    }
  };

  const toggleServiceSelection = (serviceId: string) => {
    const allIds = services.map(s => s.id);
    if (selectedServices.includes(serviceId)) {
      if (serviceId === 'internet') {
        setSelectedServices(selectedServices.filter(id => !allIds.includes(id)));
      } else {
        setSelectedServices(selectedServices.filter(id => id !== serviceId));
      }
    } else {
      if (serviceId === 'internet') {
        setSelectedServices([...selectedServices, ...allIds].filter((id, i, arr) => arr.indexOf(id) === i));
      } else {
        setSelectedServices([...selectedServices, serviceId]);
      }
    }
  };

  const toggleSelectAll = () => {
    setSelectedServices(selectedServices.length === services.length ? [] : services.map(s => s.id));
  };

  const allServicesSelected = selectedServices.length === services.length;

  const handleNext = () => {
    if (onNext && selectedServices.length > 0) {
      const selected = services.filter(s => selectedServices.includes(s.id));
      onNext(selected, [], disconnectionDate);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Active Services</h1>
        <ContextBar action={action ?? null} selectedSA={selectedSA} />
      </div>
      <Breadcrumb steps={['Select account', 'Services', 'Review order']} currentIndex={1} />

      {onNext && (
        <div className="mb-6 flex items-center gap-3">
          <label className="text-gray-600 flex items-center gap-1.5 whitespace-nowrap font-medium">
            Requested Disconnection Date<span className="text-red-600 ml-1">*</span>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Business days only. Same-day disconnection is not available.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </label>
          <DateInput value={disconnectionDate} onChange={v => setDisconnectionDate(nextWeekday(v))} min={today} className="w-40" />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allServicesSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 border-2 border-gray-400 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Select All</span>
                  </label>
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                 
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.flatMap((service) => {
                const isAutoSelected = selectedServices.includes('internet') && service.id !== 'internet';
                const mainRow = (
                  <tr
                    key={service.id}
                    className={`hover:bg-gray-50 transition-colors ${isAutoSelected ? 'border-l-4 border-amber-400' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => toggleServiceSelection(service.id)}
                          disabled={isAutoSelected}
                          className={`w-4 h-4 border-2 border-gray-400 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${
                            isAutoSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                        />
                        {service.children && service.children.length > 0 && (
                          <button
                            onClick={() => toggleExpand(service.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {expanded.includes(service.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {(!service.children || service.children.length === 0) && (
                          <div className="w-4" />
                        )}
                        {getServiceIcon(service.id)}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{service.name}</span>
                            {isAutoSelected && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                <AlertCircle className="w-3 h-3" />
                                Auto-selected
                              </span>
                            )}
                          </div>
                          {service.id === 'internet' && selectedServices.includes('internet') && dependentServiceNames && (
                            <span className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Disconnecting Internet will also disconnect {dependentServiceNames}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {service.status}
                      </span>
                    </td>
                  </tr>
                );

                const expandedRow = expanded.includes(service.id) && service.children ? (
                  <tr key={`${service.id}-expanded`} className="bg-gray-50 border-t border-gray-100">
                    <td className="px-6 py-0" colSpan={2}>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-600 text-[14px]">Item</th>
                            {service.id !== 'internet' && service.id !== 'phone' && (
                              <th className="px-6 py-2 text-center text-xs font-medium text-gray-600 text-[14px]">Quantity</th>
                            )}
                            <th className="px-6 py-2 text-right text-xs font-medium text-gray-600 text-[14px]">Recurring Charge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {service.children.map((child, index) => {
                            return (
                            <tr
                              key={child.id}
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-colors`}
                            >
                              <td className={`px-6 py-3 text-sm text-gray-700`}>
                                <div className="flex items-center gap-2 text-sm">
                                  {child.id === 'tv-cinemax' && (
                                    <img src={cinemaxLogo} alt="Cinemax Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'tv-hbo' && (
                                    <img src={hboLogo} alt="HBO Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'tv-showtime' && (
                                    <img src={showtimeLogo} alt="Showtime Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'tv-starz' && (
                                    <img src={starzLogo} alt="Starz Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'tv-sports' && (
                                    <img src={sportsTierLogo} alt="Sports Tier Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'tv-fanatic' && (
                                    <img src={fanaticLogo} alt="FANatic Logo" className="w-12 h-12" />
                                  )}
                                  {child.id === 'internet-support' ? 'Tech Home Support – Existing customers' :
                                   child.id === 'phone-directory' ? 'Directory Listing (Unlisted)' :
                                   child.id === 'phone-longdistance' ? 'Long Distance (Unlimited)' :
                                   child.name}
                                </div>
                              </td>
                              {service.id !== 'internet' && service.id !== 'phone' && (
                                <td className={`px-6 py-3 text-center text-sm text-gray-700`}>
                                  {(() => {
                                    const quantity = child.id === 'phone-longdistance' ? 1 : child.id === 'tv-dvr' ? 50 : child.id.includes('additional') || child.id === 'tv-streams' ? 3 : 1;
                                    return quantity > 1 ? quantity : '';
                                  })()}
                                </td>
                              )}
                              <td className={`px-6 py-3 text-right text-sm text-gray-700`}>
                                {child.id === 'internet-elitewifi' ? '$12.00' :
                                 child.id === 'tv-connectivity' ? '$0.13' :
                                 child.id === 'phone-longdistance' ? '$25.80' :
                                 child.id === 'phone-directory' ? '$2.99' : 
                                 child.id === 'internet-assurance' ? '$3.49' :
                                 child.id === 'phone-voice' ? '$0.00' :
                                 child.id === 'phone-callerid' ? '$0.00' :
                                 child.id === 'phone-callwaiting' ? '$0.00' :
                                 child.id === 'phone-voicemail' ? '$0.00' :
                                 child.id === 'tv-streams' ? '$0.00' :
                                 child.id === 'tv-dvr' ? '$0.00' :
                                 child.id === 'tv-broadcaster' ? '$35.94' :
                                 child.id === 'tv-music' ? '$0.00' :
                                 child.id === 'tv-cinemax' ? '$12.95' :
                                 child.id === 'tv-fanatic' ? '$5.99' :
                                 child.id === 'tv-hbo' ? '$18.95' :
                                 child.id === 'tv-showtime' ? '$19.95' :
                                 child.id === 'tv-starz' ? '$12.95' :
                                 child.id === 'tv-sports' ? '$6.95' : '$0.00'}
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null;

                return expandedRow ? [mainRow, expandedRow] : [mainRow];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason for disconnection + Comments */}
      {onNext && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="disconnection-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
              Disconnection Reason<span className="text-red-600 ml-1">*</span>
            </label>
            <select
              id="disconnection-reason"
              value={disconnectionReason}
              onChange={e => onReasonChange?.(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a reason</option>
              <option value="audit-cleanup">Audit / Cleanup</option>
              <option value="closing-business">Closing Business</option>
              <option value="competition">Competition</option>
              <option value="deceased">Deceased</option>
              <option value="financial-reason">Financial Reason</option>
              <option value="moved">Moved</option>
              <option value="npd">NPD (Non-Pay Disconnect)</option>
              <option value="ownership-change">Ownership Change</option>
              <option value="price">Price</option>
              <option value="seasonal">Seasonal</option>
              <option value="service-quality">Service Quality</option>
              <option value="temporary-to-permanent">Temporary to Permanent</option>
            </select>
          </div>
          <div>
            <label htmlFor="additional-comments" className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional Comments
            </label>
            <textarea
              id="additional-comments"
              value={disconnectionComments}
              onChange={e => onCommentsChange?.(e.target.value)}
              rows={3}
              placeholder="Enter any additional comments..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      )}

      {(onBack || onNext) && (
        <div className="mt-8 flex justify-end gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          )}
          {onNext && (
            <button
              onClick={handleNext}
              disabled={selectedServices.length === 0 || !disconnectionReason}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedServices.length === 0 || !disconnectionReason
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}