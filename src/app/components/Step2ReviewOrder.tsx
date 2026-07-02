import { Trash2, Info, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import type { OrderItem, Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';
import { Breadcrumb } from './Breadcrumb';

interface Step2Props {
  orderItems: OrderItem[];
  service: Service;
  disconnectionDate: string;
  totalActiveMonthlyCharges: number;
  disconnectionReason: string;
  disconnectionComments: string;
  onReasonChange: (reason: string) => void;
  onCommentsChange: (comments: string) => void;
  onRemoveItem: (itemId: string) => void;
  onDisconnectionDateChange: (date: string) => void;
  onBack: () => void;
  onContinue: () => void;
  action?: MACDAction | null;
  selectedSA?: Service | null;
}

export function Step2ReviewOrder({ orderItems, service, disconnectionDate, totalActiveMonthlyCharges, disconnectionReason, disconnectionComments, onReasonChange, onCommentsChange, onRemoveItem, onDisconnectionDateChange, onBack, onContinue, action, selectedSA }: Step2Props) {
  // Filter out Installation Fees items
  const filteredOrderItems = orderItems.filter(item => item.description !== 'Installation Fees');
  
  // Group items by service
  const groupedItems = filteredOrderItems.reduce((acc, item) => {
    if (!acc[item.serviceName]) {
      acc[item.serviceName] = [];
    }
    acc[item.serviceName].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  // Get unique service names being disconnected
  const servicesBeingDisconnected = Object.keys(groupedItems);

  // State to track collapsed services - initialize with all services collapsed by default
  const [collapsedServices, setCollapsedServices] = useState<Set<string>>(new Set(servicesBeingDisconnected));
  
  // Toggle collapse state for a service
  const toggleService = (serviceName: string) => {
    const newCollapsed = new Set(collapsedServices);
    if (newCollapsed.has(serviceName)) {
      newCollapsed.delete(serviceName);
    } else {
      newCollapsed.add(serviceName);
    }
    setCollapsedServices(newCollapsed);
  };

  // Calculate charges
  const totalMonthlyCharges = totalActiveMonthlyCharges;
  const disconnectingServiceCharges = orderItems.reduce((sum, item) => sum + (item.monthlyCharge * item.quantity), 0);
  const remainingMonthlyCharges = totalActiveMonthlyCharges - disconnectingServiceCharges;

  // Derive the services that remain active after disconnection (for the tooltip)
  const disconnectedServiceIds = new Set(orderItems.map(item => item.serviceId));
  const priceAffectedProducts: string[] = [];
  if (!disconnectedServiceIds.has('internet')) {
    priceAffectedProducts.push('Residential Internet', 'Service Assurance');
    if (selectedSA?.id === 'sa-00912') priceAffectedProducts.push('Elite Wi-Fi');
  }
  if (selectedSA?.id === 'sa-00912' && !disconnectedServiceIds.has('tv')) {
    priceAffectedProducts.push('iTV Preferred');
  }
  if (selectedSA?.id === 'sa-01047' && !disconnectedServiceIds.has('phone')) {
    priceAffectedProducts.push('Phone bundle');
  }
  
  // Proration calculation (simplified - assuming 15 days remaining in cycle)
  const daysRemaining = 15;
  const prorationCredit = (disconnectingServiceCharges / 30) * daysRemaining;
  
  // Additional fees (simplified examples)
  const earlyTerminationFee = service.id === 'internet' ? 150.00 : 0;
  const equipmentCredit = service.id === 'internet' ? 50.00 : 0;
  const oneTimeDisconnectCharge = 0;
  
  const finalTotal = disconnectingServiceCharges - prorationCredit + oneTimeDisconnectCharge + earlyTerminationFee - equipmentCredit;

  const formatDisconnectionDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Review Order</h1>
        <ContextBar action={action ?? null} selectedSA={selectedSA} />

      </div>
      <Breadcrumb steps={['Select account', 'Services', 'Review order']} currentIndex={2} />

      <div className="flex gap-6 items-start">
      {/* Left column: main content */}
      <div className="flex-1 min-w-0">

      {/* Unified Service Being Disconnected */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">

        {disconnectionDate && (
          <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Requested Disconnection Date:</span>
            <span>{formatDisconnectionDate(disconnectionDate)}</span>
          </div>
        )}

        {orderItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No items remain in this disconnect order.</p>
            <p className="text-sm text-gray-400 mt-2">All items have been removed.</p>
          </div>
        ) : filteredOrderItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No items to display.</p>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Item Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Monthly Charge
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {servicesBeingDisconnected.flatMap((serviceName, serviceIndex) => {
                    const serviceItems = groupedItems[serviceName];
                    const isCollapsed = collapsedServices.has(serviceName);
                    
                    const rows = [
                      // Service Header Row
                      <tr 
                        key={`header-${serviceName}`}
                        className="bg-gray-100 border-t border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => toggleService(serviceName)}
                      >
                        <td colSpan={3} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                  isCollapsed ? '-rotate-90' : ''
                                }`}
                              />
                              <span className="font-medium text-gray-900">{serviceName}</span>
                              <span className="text-xs text-gray-500">
                                ({serviceItems.length} {serviceItems.length === 1 ? 'item' : 'items'})
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ];
                    
                    // Add child items if not collapsed
                    if (!isCollapsed) {
                      serviceItems.forEach((item) => {
                        rows.push(
                          <motion.tr
                            key={`item-${item.id}`}
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-gray-50 border-b border-gray-200"
                          >
                            <td className="px-4 py-4 text-sm text-gray-900 pl-8">
                              {item.description}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                Disconnect
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right">
                              ${item.monthlyCharge.toFixed(2)}
                            </td>
                          </motion.tr>
                        );
                      });
                    }
                    
                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      </div>{/* end left column */}

      {/* Right column: Order Summary */}
      <div className="w-80 shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sticky top-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          
          {/* Service Info */}
          <div className="pb-4 mb-4 border-b border-gray-200">
            {(() => {
              // Get unique service names from order items
              const uniqueServices = Array.from(new Set(orderItems.map(item => item.serviceName)));
              return uniqueServices.map((serviceName, index) => (
                <p key={index} className="text-sm font-medium text-gray-900 mb-1">{serviceName}</p>
              ));
            })()}
            <p className="text-xs text-gray-600">
              Disconnection: {formatDisconnectionDate(disconnectionDate)}
            </p>
          </div>

          {/* Charges Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Current monthly charges</span>
              <span className="text-gray-900">${totalMonthlyCharges.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Services being disconnected</span>
              <span className="text-red-600">-${disconnectingServiceCharges.toFixed(2)}</span>
            </div>
          </div>

          {/* Difference */}
          <div className="flex items-center justify-between pt-4 pb-4 mt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700 flex items-center gap-1.5">
              Difference
              <div className="relative group/diff">
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-3 py-2.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/diff:opacity-100 transition-opacity pointer-events-none z-10 font-normal">
                  {priceAffectedProducts.length > 0 && (
                    <>
                      <p className="font-semibold mb-1">Price-Affected Products:</p>
                      <p className="text-gray-300 mb-2">These products will not be disconnected but are included in the order for <span className="font-semibold text-white">pricing recalculation.</span></p>
                      <ul className="space-y-1">
                        {priceAffectedProducts.map(name => (
                          <li key={name} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            {name}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {priceAffectedProducts.length === 0 && (
                    <p>Monthly savings from disconnecting these services.</p>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            </span>
            <span className="text-base font-bold text-red-600">
              -${disconnectingServiceCharges.toFixed(2)}
            </span>
          </div>

          {/* Total */}
          <div className="pt-4 border-t-2 border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Remaining Charges</span>
              <span className="text-xl font-medium text-gray-900">
                ${remainingMonthlyCharges.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Additional Info */}
       
        </div>
      </div>
      </div>{/* end right column */}
      </div>{/* end flex row */}

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          You are about to disconnect{disconnectionDate ? ` on ${formatDisconnectionDate(disconnectionDate)}` : ''}. This action cannot be undone.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-end gap-3 pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={orderItems.length === 0}
          className="px-8 py-2.5 rounded-md font-medium transition-colors border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Disconnection
        </button>
      </div>
    </div>
  );
}