// Shared Work Order data model and mock results, used by the Follow On Order
// flow (see FollowOnRequesterType.tsx, which now also owns the Work Order
// lookup UI) and by downstream screens (ChangeInternetPlan, ChangeReviewOrder).

export interface OpenFollowOn {
  id: string;
  status: string;            // e.g. 'Not Started'
  products: string[];
}

export interface WorkOrderResult {
  id: string;                // Work Order id (WO-…)
  customerName: string;
  saId: string;
  saLabel: string;
  address: string;
  serviceType: string;
  technician: string;
  techId: string;
  upsellPlanId: string;
  // ── Original installation order this work order belongs to (RFBP1-1534) ──
  orderNumber: string;       // e.g. 'ORD-20431' — shown as "Original order" context
  orderStatus: 'In Progress' | 'Completed';
  orderSubStatus: string;    // e.g. 'Installing'
  products: string[];        // products on the original order
  // ── An already-open, not-yet-started follow-on on the same original order (RFBP1-1542) ──
  openFollowOn: OpenFollowOn | null;
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
    orderNumber: 'ORD-20431',
    orderStatus: 'In Progress',
    orderSubStatus: 'Installing',
    products: ['Internet 200 Mbps'],
    openFollowOn: null,
  },
  // Demo: the original order is no longer in progress → Continue is blocked.
  {
    id: 'WO-10388',
    customerName: 'Robert Johnson',
    saId: 'SA-00912',
    saLabel: 'Primary',
    address: '412 Oak Ave, Lincoln, NE 68501',
    serviceType: 'Internet Install',
    technician: 'Marcus Webb',
    techId: 'TCH-2291',
    upsellPlanId: '1gig',
    orderNumber: 'ORD-20388',
    orderStatus: 'Completed',
    orderSubStatus: 'Completed',
    products: ['Internet 200 Mbps'],
    openFollowOn: null,
  },
  // Demo: an open follow-on that has not started yet → offer "Add to this order".
  {
    id: 'WO-10455',
    customerName: 'Robert Johnson',
    saId: 'SA-00912',
    saLabel: 'Primary',
    address: '412 Oak Ave, Lincoln, NE 68501',
    serviceType: 'Internet Install',
    technician: 'Marcus Webb',
    techId: 'TCH-2291',
    upsellPlanId: '1gig',
    orderNumber: 'ORD-20455',
    orderStatus: 'In Progress',
    orderSubStatus: 'Installing',
    products: ['Internet 200 Mbps'],
    openFollowOn: { id: 'FO-30112', status: 'Not Started', products: ['Elite Wi-Fi'] },
  },
];

// Prototype lookup: an exact Work Order id returns that order; anything else falls back to
// the default happy-path order so the flow stays easy to demo.
export function searchWorkOrders(query: string): WorkOrderResult[] {
  const q = query.trim().toUpperCase();
  const exact = MOCK_WORK_ORDERS.filter(wo => wo.id.toUpperCase() === q);
  return exact.length ? exact : [MOCK_WORK_ORDERS[0]];
}
