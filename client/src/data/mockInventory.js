import { daysFromNow } from '../utils/dateUtils.js';

export const scanLogs = [
  { id: 'SCAN-001', copyId: 'BB-2048', registeredLocationId: 'SHELF-A-04', observedLocationId: 'SHELF-A-04', scannedAt: daysFromNow(0, 9), scanType: 'INVENTORY', verificationStatus: 'MATCH', transactionId: null },
  { id: 'SCAN-002', copyId: 'BB-2055', registeredLocationId: 'SHELF-C-02', observedLocationId: 'SHELF-B-07', scannedAt: daysFromNow(-1, 15), scanType: 'MANUAL_DEMO', verificationStatus: 'SIMULATED_MISMATCH', transactionId: null },
  { id: 'SCAN-003', copyId: 'BB-2065', registeredLocationId: 'SHELF-C-06', observedLocationId: 'SHELF-A-08', scannedAt: daysFromNow(-2, 11), scanType: 'INVENTORY', verificationStatus: 'SIMULATED_MISMATCH', transactionId: null },
  { id: 'SCAN-004', copyId: 'BB-2049', registeredLocationId: 'SHELF-A-05', observedLocationId: 'SHELF-A-05', scannedAt: daysFromNow(-1, 12), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-001' },
  { id: 'SCAN-005', copyId: 'BB-2050', registeredLocationId: 'SHELF-B-01', observedLocationId: 'SHELF-B-01', scannedAt: daysFromNow(-3, 10), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-002' },
  { id: 'SCAN-006', copyId: 'BB-2051', registeredLocationId: 'SHELF-B-02', observedLocationId: 'SHELF-B-02', scannedAt: daysFromNow(-5, 14), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-003' },
  { id: 'SCAN-007', copyId: 'BB-2052', registeredLocationId: 'SHELF-B-03', observedLocationId: 'SHELF-B-03', scannedAt: daysFromNow(-1, 16), scanType: 'RETURN', verificationStatus: 'MATCH', transactionId: 'TXN-008' },
  { id: 'SCAN-008', copyId: 'BB-2054', registeredLocationId: 'SHELF-C-01', observedLocationId: 'SHELF-C-01', scannedAt: daysFromNow(-2, 13), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-004' },
  { id: 'SCAN-009', copyId: 'BB-2059', registeredLocationId: 'SHELF-C-04', observedLocationId: 'SHELF-C-04', scannedAt: daysFromNow(-4, 10), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-005' },
  { id: 'SCAN-010', copyId: 'BB-2061', registeredLocationId: 'SHELF-A-08', observedLocationId: 'SHELF-A-08', scannedAt: daysFromNow(-3, 9), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-006' },
  { id: 'SCAN-011', copyId: 'BB-2067', registeredLocationId: 'SHELF-A-10', observedLocationId: 'SHELF-A-10', scannedAt: daysFromNow(-6, 15), scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: 'TXN-007' },
  { id: 'SCAN-012', copyId: 'BB-2062', registeredLocationId: 'SHELF-B-06', observedLocationId: 'SHELF-B-06', scannedAt: daysFromNow(-4, 12), scanType: 'RETURN', verificationStatus: 'MATCH', transactionId: 'TXN-010' },
];

export const misplacedAlerts = [
  { id: 'ALERT-001', copyId: 'BB-2055', registeredLocationId: 'SHELF-C-02', observedLocationId: 'SHELF-B-07', detectedAt: daysFromNow(-1, 15), status: 'NEW', confidence: 'SIMULATED', resolutionHistory: [] },
  { id: 'ALERT-002', copyId: 'BB-2065', registeredLocationId: 'SHELF-C-06', observedLocationId: 'SHELF-A-08', detectedAt: daysFromNow(-2, 11), status: 'INVESTIGATING', confidence: 'SIMULATED', resolutionHistory: [{ at: daysFromNow(-1, 10), action: 'Marked under investigation', actor: 'Maya Thompson' }] },
];

export const notifications = [
  { id: 'NOTE-001', userId: 'USER-001', title: 'A book is due soon', message: 'Introduction to Algorithms is due in 6 days.', type: 'due', createdAt: daysFromNow(0, 8), read: false, path: '/borrowed' },
  { id: 'NOTE-002', userId: 'USER-001', title: 'Overdue book', message: 'Database System Concepts is 3 days overdue. Please return it at the circulation desk.', type: 'overdue', createdAt: daysFromNow(0, 8), read: false, path: '/due-fines' },
  { id: 'NOTE-003', userId: 'USER-001', title: 'Demo fine balance', message: 'A demonstration fine is accruing under the mock policy.', type: 'fine', createdAt: daysFromNow(-1, 9), read: true, path: '/due-fines' },
  { id: 'NOTE-004', userId: 'USER-001', title: 'Return recorded', message: 'The Pragmatic Programmer was recorded as returned.', type: 'return', createdAt: daysFromNow(-4, 12), read: true, path: '/borrowed' },
  { id: 'NOTE-005', userId: 'USER-006', title: 'Possible location mismatch', message: 'A simulated scan for Learning React differs from its registered shelf.', type: 'alert', createdAt: daysFromNow(-1, 15), read: false, path: '/librarian/misplaced' },
  { id: 'NOTE-006', userId: 'USER-006', title: 'New scan record', message: 'A demonstration inventory scan has been added for Cosmos.', type: 'scan', createdAt: daysFromNow(-2, 11), read: false, path: '/librarian/scans' },
  { id: 'NOTE-007', userId: 'USER-006', title: 'Overdue return needs attention', message: 'Three active demo loans are currently overdue.', type: 'overdue', createdAt: daysFromNow(0, 9), read: false, path: '/librarian/circulation' },
];
