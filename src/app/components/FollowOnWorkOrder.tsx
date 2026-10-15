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
  serviceAppointmentId: string; // Service Appointment id (SAP-…)
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
    serviceAppointmentId: 'SAP-00871',
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
    serviceAppointmentId: 'SAP-00850',
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
    serviceAppointmentId: 'SAP-00890',
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

export interface WorkOrderSearchCriteria {
  workOrderId?: string;
  customerName?: string;
  address?: string;
  serviceAppointmentId?: string;
}

// Prototype lookup: the agent can search by Work Order id, customer name, location address or
// Service Appointment id. Every criterion provided must match (case-insensitive, partial match).
// If nothing matches, fall back to the default happy-path order so the flow stays easy to demo.
export function searchWorkOrders(c: WorkOrderSearchCriteria): WorkOrderResult[] {
  const norm = (v?: string) => (v ?? '').trim().toLowerCase();
  const has = (field: string, q: string) => !q || field.toLowerCase().includes(q);
  const id = norm(c.workOrderId), name = norm(c.customerName),
        addr = norm(c.address), sap = norm(c.serviceAppointmentId);
  const hits = MOCK_WORK_ORDERS.filter(wo =>
    has(wo.id, id) && has(wo.customerName, name) && has(wo.address, addr) && has(wo.serviceAppointmentId, sap));
  return hits.length ? hits : [MOCK_WORK_ORDERS[0]];
}
