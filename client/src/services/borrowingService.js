import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData, makeId } from './mockStore.js';
import { calculateFine, transactionState } from '../utils/dateUtils.js';

function enrich(transaction, data) {
  const copy = data.copies.find((entry) => entry.id === transaction.copyId);
  const book = data.books.find((entry) => entry.id === copy?.bookId);
  const user = data.users.find((entry) => entry.id === transaction.userId);
  const location = data.locations.find((entry) => entry.id === copy?.locationId);
  return { ...transaction, copy, book, user, location, derivedState: transactionState(transaction), calculatedFine: calculateFine(transaction) };
}

export async function getAllTransactions() {
  if (isApiMode()) return apiRequest('/borrowings');
  const data = getMockData();
  return data.transactions.map((transaction) => enrich(transaction, data)).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
}

export async function getMyBorrowedBooks(userId) {
  if (isApiMode()) return apiRequest('/borrowings/my');
  const data = getMockData();
  return data.transactions.filter((transaction) => transaction.userId === userId).map((transaction) => enrich(transaction, data)).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
}

export async function getOverdueTransactions() {
  if (isApiMode()) return apiRequest('/borrowings?status=overdue');
  return (await getAllTransactions()).filter((transaction) => transaction.derivedState === 'overdue');
}

export async function issueBook({ userId, copyId, dueAt }) {
  if (isApiMode()) return apiRequest('/borrowings/issue', { method: 'POST', body: { userId, copyId, dueAt } });
  return updateMockData((data) => {
    const user = data.users.find((entry) => entry.id === userId && entry.active && entry.role === 'student');
    const copy = data.copies.find((entry) => entry.id === copyId);
    if (!user) throw new Error('Select an active student account before issuing a copy.');
    if (!copy) throw new Error('That physical copy could not be found.');
    if (copy.status !== 'AVAILABLE' || data.transactions.some((transaction) => transaction.copyId === copyId && transaction.status === 'ISSUED')) throw new Error('This copy is not available to issue. Refresh the page and choose an available copy.');
    const issuedAt = new Date().toISOString();
    const resolvedDueAt = dueAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const transaction = { id: makeId('TXN', data.transactions), userId, copyId, issuedAt, dueAt: resolvedDueAt, returnedAt: null, status: 'ISSUED', fineAmount: 0, paymentStatus: 'NONE' };
    copy.status = 'ISSUED';
    copy.lastScannedAt = issuedAt;
    data.transactions.push(transaction);
    data.scanLogs.unshift({ id: makeId('SCAN', data.scanLogs), copyId, registeredLocationId: copy.locationId, observedLocationId: copy.locationId, scannedAt: issuedAt, scanType: 'ISSUE', verificationStatus: 'MATCH', transactionId: transaction.id });
    data.notifications.unshift({ id: makeId('NOTE', data.notifications), userId, title: 'Book checked out', message: `Your copy ${copy.id} has been issued. Please return it by ${new Date(resolvedDueAt).toLocaleDateString()}.`, type: 'issue', createdAt: issuedAt, read: false, path: '/borrowed' });
    return enrich(transaction, data);
  });
}

export async function returnBook({ copyId, observedLocationId, actorName = 'Librarian' }) {
  if (isApiMode()) return apiRequest('/borrowings/return', { method: 'POST', body: { copyId, observedLocationId } });
  return updateMockData((data) => {
    const copy = data.copies.find((entry) => entry.id === copyId);
    const transaction = data.transactions.find((entry) => entry.copyId === copyId && entry.status === 'ISSUED');
    if (!copy || !transaction) throw new Error('No active borrowing transaction was found for that copy.');
    const returnedAt = new Date().toISOString();
    const fineAmount = calculateFine(transaction);
    const observed = observedLocationId || copy.locationId;
    const mismatch = observed !== copy.locationId;
    transaction.status = 'RETURNED';
    transaction.returnedAt = returnedAt;
    transaction.fineAmount = fineAmount;
    transaction.paymentStatus = fineAmount > 0 ? 'UNPAID' : 'NONE';
    copy.status = 'AVAILABLE';
    copy.lastScannedAt = returnedAt;
    const scan = { id: makeId('SCAN', data.scanLogs), copyId, registeredLocationId: copy.locationId, observedLocationId: observed, scannedAt: returnedAt, scanType: 'RETURN', verificationStatus: mismatch ? 'SIMULATED_MISMATCH' : 'MATCH', transactionId: transaction.id };
    data.scanLogs.unshift(scan);
    if (mismatch && !data.misplacedAlerts.some((alert) => alert.copyId === copyId && alert.status !== 'RESOLVED')) {
      data.misplacedAlerts.unshift({ id: makeId('ALERT', data.misplacedAlerts), copyId, registeredLocationId: copy.locationId, observedLocationId: observed, detectedAt: returnedAt, status: 'NEW', confidence: 'SIMULATED', resolutionHistory: [] });
    }
    data.notifications.unshift({ id: makeId('NOTE', data.notifications), userId: transaction.userId, title: 'Return recorded', message: `${data.books.find((book) => book.id === copy.bookId)?.title || 'Your book'} was recorded as returned by ${actorName}.`, type: 'return', createdAt: returnedAt, read: false, path: '/borrowed' });
    return { transaction: enrich(transaction, data), mismatch, scan };
  });
}
