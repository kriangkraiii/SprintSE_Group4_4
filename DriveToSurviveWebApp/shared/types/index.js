/**
 * Shared types / constants ใช้ร่วมกันระหว่าง client & server
 */

// ─── User Roles ───
export const ROLES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
};

// ─── Verification Status ───
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// ─── Route Status ───
export const ROUTE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  FULL: 'FULL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  IN_TRANSIT: 'IN_TRANSIT',
};

// ─── Booking Status ───
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

// ─── Notification Types ───
export const NOTIFICATION_TYPE = {
  SYSTEM: 'SYSTEM',
  VERIFICATION: 'VERIFICATION',
  BOOKING: 'BOOKING',
  ROUTE: 'ROUTE',
};
