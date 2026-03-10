/**
 * Canonical status display maps — single source of truth for all status → label and status → color mappings.
 * Used by Shifts, Bookings, ShiftDetails, and any future pages that display statuses.
 */

// ── Shift statuses ──────────────────────────────────────────────────────────────

export const SHIFT_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  dispatching: 'In Dispatch',
  booked: 'Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** Tab-friendly display labels for shift list pages (maps backend status → UI tab name). */
export const SHIFT_STATUS_TAB: Record<string, string> = {
  draft: 'Drafts',
  open: 'Open',
  dispatching: 'In Dispatch',
  booked: 'Filled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const SHIFT_TAB_COLOR: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Dispatch': 'bg-amber-100 text-amber-700 border-amber-200',
  Filled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Drafts: 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Completed: 'bg-purple-100 text-purple-700 border-purple-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  Expired: 'bg-gray-100 text-gray-700 border-gray-200',
};

// ── Booking statuses ────────────────────────────────────────────────────────────

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show flagged',
};

export const BOOKING_TAB_COLOR: Record<string, string> = {
  Upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  'No-show flagged': 'bg-red-100 text-red-700 border-red-200',
  'Pending Payment': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

// ── Generic helpers ─────────────────────────────────────────────────────────────

export function getShiftTabColor(tab: string): string {
  return SHIFT_TAB_COLOR[tab] ?? 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getBookingTabColor(tab: string): string {
  return BOOKING_TAB_COLOR[tab] ?? 'bg-slate-100 text-slate-700 border-slate-200';
}
