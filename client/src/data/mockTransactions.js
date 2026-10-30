import { daysFromNow } from '../utils/dateUtils.js';

export const transactions = [
  { id: 'TXN-001', userId: 'USER-001', copyId: 'BB-2049', issuedAt: daysFromNow(-8), dueAt: daysFromNow(6), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'NONE' },
  { id: 'TXN-002', userId: 'USER-001', copyId: 'BB-2050', issuedAt: daysFromNow(-17), dueAt: daysFromNow(-3), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'UNPAID' },
  { id: 'TXN-003', userId: 'USER-002', copyId: 'BB-2051', issuedAt: daysFromNow(-19), dueAt: daysFromNow(-5), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'UNPAID' },
  { id: 'TXN-004', userId: 'USER-003', copyId: 'BB-2054', issuedAt: daysFromNow(-16), dueAt: daysFromNow(-2), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'UNPAID' },
  { id: 'TXN-005', userId: 'USER-004', copyId: 'BB-2059', issuedAt: daysFromNow(-11), dueAt: daysFromNow(3), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'NONE' },
  { id: 'TXN-006', userId: 'USER-005', copyId: 'BB-2061', issuedAt: daysFromNow(-4), dueAt: daysFromNow(10), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'NONE' },
  { id: 'TXN-007', userId: 'USER-002', copyId: 'BB-2067', issuedAt: daysFromNow(-6), dueAt: daysFromNow(8), returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'NONE' },
  { id: 'TXN-008', userId: 'USER-003', copyId: 'BB-2052', issuedAt: daysFromNow(-15), dueAt: daysFromNow(-8), returnedAt: daysFromNow(-1), status: 'RETURNED', fineAmount: 3.5, paymentStatus: 'PAID' },
  { id: 'TXN-009', userId: 'USER-004', copyId: 'BB-2053', issuedAt: daysFromNow(-18), dueAt: daysFromNow(-4), returnedAt: daysFromNow(-3), status: 'RETURNED', fineAmount: 0.5, paymentStatus: 'PAID' },
  { id: 'TXN-010', userId: 'USER-001', copyId: 'BB-2062', issuedAt: daysFromNow(-12), dueAt: daysFromNow(2), returnedAt: daysFromNow(-4), status: 'RETURNED', fineAmount: 0, paymentStatus: 'NONE' },
];
