import { books } from './mockBooks.js';
import { copies } from './mockCopies.js';
import { users } from './mockUsers.js';
import { transactions } from './mockTransactions.js';
import { libraryMap, locations } from './mockLocations.js';
import { misplacedAlerts, notifications, scanLogs } from './mockInventory.js';
import { daysFromNow } from '../utils/dateUtils.js';

export const MOCK_DATA_VERSION = 2;

export function createInitialData() {
  const titles = books.map((book, index) => ({ ...book, createdAt: daysFromNow(-index * 8) }));
  return structuredClone({
    version: MOCK_DATA_VERSION,
    books: titles,
    copies,
    users,
    transactions,
    libraryMap,
    locations,
    misplacedAlerts,
    scanLogs,
    notifications,
    auditRuns: [],
  });
}
