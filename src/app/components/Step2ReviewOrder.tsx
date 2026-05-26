import { Trash2, Info, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import type { OrderItem, Service } from '../App';
import type { MACDAction } from './DispatcherStep1';
import { ContextBar } from './ContextBar';

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
  const totalMonthlyCharges = totalActiveMonthlyCharges; // Total of ALL active services ($165.48)
  const disconnectingServiceCharges = orderItems.reduce((sum, item) => sum + (item.monthlyCharge * item.quantity), 0);
  
  // Calculate remaining monthly charges after disconnection
  const remainingMonthlyCharges = totalActiveMonthlyCharges - disconnectingServiceCharges;
  
  // Proration calculation (simplified - assuming 15 days remaining in cycle)
  const daysRemaining = 15;
  const prorationCredit = (disconnectingServiceCharges / 30) * daysRemaining;
  
  // Additional fees (simplified examples)
  const earlyTerminationFee = service.id === 'internet' ? 150.00 : 0;
  const equipmentCredit = service.id === 'internet' ? 50.00 : 0;
  const oneTimeDisconnectCharge = 0;
  
  const finalTotal = disconnectingServiceCharges - prorationCredit + oneTimeDisconnectCharge + earlyTerminationFee - equipmentCredit;

  const formatDisconnectionDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Review Order</h1>
        <ContextBar action={action ?? null} selectedSA={selectedSA} />
      
      </div>

      <div className="flex gap-6 items-start">
      {/* Left column: main content */}
      <div className="flex-1 min-w-0">

      {/* Unified Service Being Disconnected */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 text-[20px]">
              Requested Disconnection Date<span className="text-red-600 ml-1">*</span>
              <div className="relative group">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Disconnection might take X and Z amount of days.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            </label>
            <input
              type="date"
              value={disconnectionDate}
              onChange={(e) => onDisconnectionDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-900 bg-white font-normal text-[16px] cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

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
                      Quantity
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
          <div className="space-y-4 mb-4">
            {/* Monthly Charges Section */}
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Current monthly charges</span>
                <span className="text-gray-900">${orderItems.reduce((total, item) => total + (item.quantity * item.monthlyCharge), 0).toFixed(2)}</span>
              </div>
            </div>

        
          </div>

          {/* Total */}
          <div className="pt-4 border-t-2 border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Remaining Charges</span>
              <span className="text-xl font-medium text-gray-900">
                {(() => {
                  const totalMonthlyCharges = orderItems.reduce((total, item) => total + (item.quantity * item.monthlyCharge), 0);
                  
                  // Calculate proration based on disconnection date
                  const disconnectDate = new Date(disconnectionDate);
                  const year = disconnectDate.getFullYear();
                  const month = disconnectDate.getMonth();
                  
                  // Get the first day of the billing period (1st of the month)
                  const billingStart = new Date(year, month, 1);
                  
                  // Get the last day of the billing period (last day of the month)
                  const billingEnd = new Date(year, month + 1, 0);
                  
                  // Calculate total days in the billing period
                  const totalDaysInPeriod = billingEnd.getDate();
                  
                  // Calculate days used (from 1st to disconnection date)
                  const daysUsed = disconnectDate.getDate();
                  
                  // Calculate proration factor
                  const prorationFactor = daysUsed / totalDaysInPeriod;
                  
                  // Apply proration to monthly charges
                  const proratedCharges = totalMonthlyCharges * prorationFactor;
                  
                  const equipmentCredit = orderItems.some(item => item.serviceId === 'internet') ? 50.00 : 0;
                  const finalTotal = proratedCharges - equipmentCredit;
                  return finalTotal > 0 ? `$${finalTotal.toFixed(2)}` : '$0.00';
                })()}
              </span>
            </div>
            {(() => {
              const totalMonthlyCharges = orderItems.reduce((total, item) => total + (item.quantity * item.monthlyCharge), 0);
              const equipmentCredit = orderItems.some(item => item.serviceId === 'internet') ? 50.00 : 0;
              const finalTotal = totalMonthlyCharges - equipmentCredit;
              return finalTotal <= 0 && (
                <p className="text-xs text-green-600 text-right">
                  Credit on final bill
                </p>
              );
            })()}
          </div>

          {/* Additional Info */}
       
        </div>
      </div>
      </div>{/* end right column */}
      </div>{/* end flex row */}

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