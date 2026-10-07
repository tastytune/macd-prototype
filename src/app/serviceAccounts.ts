import type { Service } from './App';

/**
 * Shared Service Account mock data (single source of truth for every "Select accounts" step)
 * and the gating helper from Jira RFBP1-3571 (AC10–13).
 */

export type OrderState = 'none' | 'submitted' | 'inProgress';
// AC11 will add 'abandonedKept' here later — isServiceAccountBlocked() is already the single place to extend.

export interface GatedService extends Service {
  orderState: OrderState;
  orderNumber?: string;
  orderType?: string;
}

export const SA_00912: GatedService = {
  id: 'sa-00912',
  name: 'SA-00912 · Primary',
  status: 'Active',
  address: '412 Oak Ave, Lincoln, NE 68501',
  orderState: 'none',
};

export const SA_01047: GatedService = {
  id: 'sa-01047',
  name: 'SA-01047 · Secondary',
  status: 'Active',
  address: '88 Maple St, Omaha, NE 68102',
  orderState: 'none',
};

export const SA_02031: GatedService = {
  id: 'sa-02031',
  name: 'SA-02031 · Tertiary',
  status: 'Active',
  address: '214 Birch Rd, Lincoln, NE 68502',
  orderState: 'none',
};

export const SA_03055: GatedService = {
  id: 'sa-03055',
  name: 'SA-03055 · Quaternary',
  status: 'Active',
  address: '305 Cedar Ln, Lincoln, NE 68505',
  orderState: 'inProgress',
  orderNumber: 'ORD-10482',
  orderType: 'Change',
};

/** A Service Account with an order in progress can't be selected in any MACD action. */
export function isServiceAccountBlocked(sa: Pick<GatedService, 'orderState'> | undefined | null): boolean {
  if (!sa) return false;
  return sa.orderState === 'inProgress'; // 'none' | 'submitted' → not blocked
}

export function blockedReason(sa: GatedService): string {
  return `Order ${sa.orderNumber} is in progress on this service account. It can't be changed until the order completes.`;
}
