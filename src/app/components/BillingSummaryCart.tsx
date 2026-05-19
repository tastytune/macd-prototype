import type { Service, OrderItem } from '../App';

interface BillingSummaryCartProps {
  service: Service;
  orderItems: OrderItem[];
  disconnectionDate: string;
}

export function BillingSummaryCart({ service, orderItems, disconnectionDate }: BillingSummaryCartProps) {
  // Calculate total monthly charges dynamically from orderItems
  const totalMonthlyCharges = orderItems.reduce((total, item) => {
    return total + (item.quantity * item.monthlyCharge);
  }, 0);
  
  // Check if Internet service is being disconnected based on orderItems
  const isInternetDisconnected = orderItems.some(item => item.serviceId === 'internet');
  
  // Additional fees (simplified examples)
  const equipmentCredit = isInternetDisconnected ? 50.00 : 0;
  const deactivationFee = 10.00;

  const finalTotal = totalMonthlyCharges + deactivationFee - equipmentCredit;

  const formatDisconnectionDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
      
      {/* Service Info */}
      <div className="pb-4 mb-4 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-1">{service.name}</p>
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
            <span className="text-gray-900">${totalMonthlyCharges.toFixed(2)}</span>
          </div>
        </div>

        {/* Deactivation Fees */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Deactivation fees</span>
            <span className="text-gray-900">${deactivationFee.toFixed(2)}/mo</span>
          </div>
        </div>

      </div>

      {/* Total */}
      <div className="pt-4 border-t-2 border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">Remaining Charges</span>
          <span className="text-xl font-medium text-gray-900">
            {finalTotal > 0 ? `$${finalTotal.toFixed(2)}` : '$0.00'}
          </span>
        </div>
        {finalTotal <= 0 && (
          <p className="text-xs text-green-600 text-right">
            Credit on final bill
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          This is an estimate. Final charges will appear on your next billing statement.
        </p>
      </div>
    </div>
  );
}