// Shared Work Order data model and mock results, used by the Follow On Order
// flow (see FollowOnRequesterType.tsx, which now also owns the Work Order
// lookup UI) and by downstream screens (ChangeInternetPlan, ChangeReviewOrder).

export interface WorkOrderResult {
  id: string;
  customerName: string;
  saId: string;
  saLabel: string;
  address: string;
  serviceType: string;
  technician: string;
  techId: string;
  upsellPlanId: string;
}

// Mocked search results — in production this comes from
// GET /technicians/:techId/work-orders?date=today
export const MOCK_WORK_ORDERS: WorkOrderResult[] = [
  {
    id: 'WO-10432',
    customerName: 'Robert Johnson',
    saId: 'SA-00912',
    saLabel: 'Primary',
    address: '412 Oak Ave, Lincoln, NE 68501',
    serviceType: 'Internet Install',
    technician: 'Marcus Webb',
    techId: 'TCH-2291',
    upsellPlanId: '1gig',
  },
];
