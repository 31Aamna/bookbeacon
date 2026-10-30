import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData } from './mockStore.js';
import { calculateFine, transactionState } from '../utils/dateUtils.js';

function inRange(value, from, to) {
  if (!value) return false;
  const date = new Date(value);
  return (!from || date >= new Date(`${from}T00:00:00`)) && (!to || date <= new Date(`${to}T23:59:59.999`));
}

export async function getReportSummary({ from = null, to = null } = {}) {
  if (isApiMode()) return apiRequest(`/reports/summary${from || to ? `?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}` : ''}`);
  const data = getMockData();
  const books = data.books.filter((book) => !book.archivedAt);
  const copies = data.copies.filter((copy) => copy.status !== 'RETIRED');
  const transactions = data.transactions.filter((transaction) => inRange(transaction.issuedAt, from, to));
  const activeTransactions = data.transactions.filter((transaction) => transaction.status === 'ISSUED');
  const issuedCopyIds = new Set(activeTransactions.map((transaction) => transaction.copyId));
  const borrowCountByTitle = new Map();
  transactions.forEach((transaction) => {
    const copy = data.copies.find((entry) => entry.id === transaction.copyId);
    if (copy) borrowCountByTitle.set(copy.bookId, (borrowCountByTitle.get(copy.bookId) || 0) + 1);
  });
  const categories = books.map((book) => ({ name: book.category, value: copies.filter((copy) => copy.bookId === book.id).length })).reduce((all, item) => {
    const existing = all.find((entry) => entry.name === item.name);
    if (existing) existing.value += item.value; else all.push({ ...item });
    return all;
  }, []).filter((entry) => entry.value > 0);
  const monthBuckets = new Map();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(); date.setDate(1); date.setHours(0, 0, 0, 0); date.setMonth(date.getMonth() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets.set(key, { month: date.toLocaleString('en', { month: 'short' }), issues: 0, returns: 0 });
  }
  transactions.forEach((transaction) => {
    const issueDate = new Date(transaction.issuedAt);
    const issueKey = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthBuckets.has(issueKey)) monthBuckets.get(issueKey).issues += 1;
    if (transaction.returnedAt) {
      const returnDate = new Date(transaction.returnedAt);
      const returnKey = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets.has(returnKey)) monthBuckets.get(returnKey).returns += 1;
    }
  });
  const totalFineBalance = data.transactions.reduce((sum, transaction) => sum + (transaction.paymentStatus === 'UNPAID' || transaction.status === 'ISSUED' ? calculateFine(transaction) : 0), 0);
  const enrichedTransactions = transactions.map((transaction) => {
    const copy = data.copies.find((entry) => entry.id === transaction.copyId);
    return { ...transaction, book: books.find((book) => book.id === copy?.bookId), copy, user: data.users.find((user) => user.id === transaction.userId), calculatedFine: calculateFine(transaction) };
  });
  return {
    totalTitles: books.length,
    totalCopies: copies.length,
    availableCopies: copies.filter((copy) => copy.status === 'AVAILABLE').length,
    issuedCopies: issuedCopyIds.size,
    overdueTransactions: activeTransactions.filter((transaction) => transactionState(transaction) === 'overdue').length,
    misplacedCopies: data.misplacedAlerts.filter((alert) => alert.status !== 'RESOLVED').length,
    registeredUsers: data.users.length,
    totalFineBalance: Number(totalFineBalance.toFixed(2)),
    categories,
    activity: [...monthBuckets.values()],
    mostBorrowed: [...borrowCountByTitle.entries()].map(([bookId, count]) => ({ book: books.find((book) => book.id === bookId), count })).filter((entry) => entry.book).sort((a, b) => b.count - a.count).slice(0, 5),
    transactions: enrichedTransactions,
  };
}

export async function getDashboardActivity() {
  if (isApiMode()) return apiRequest('/reports/activity');
  const data = getMockData();
  const events = [];
  data.transactions.forEach((transaction) => {
    const copy = data.copies.find((entry) => entry.id === transaction.copyId);
    const book = data.books.find((entry) => entry.id === copy?.bookId);
    const user = data.users.find((entry) => entry.id === transaction.userId);
    events.push({ id: `${transaction.id}-issue`, type: 'issue', occurredAt: transaction.issuedAt, transaction, copy, book, user });
    if (transaction.returnedAt) events.push({ id: `${transaction.id}-return`, type: 'return', occurredAt: transaction.returnedAt, transaction, copy, book, user });
  });
  data.scanLogs.forEach((scan) => {
    const copy = data.copies.find((entry) => entry.id === scan.copyId);
    if (copy) events.push({ id: scan.id, type: 'scan', occurredAt: scan.scannedAt, copy, book: data.books.find((book) => book.id === copy.bookId), scan });
  });
  data.misplacedAlerts.forEach((alert) => {
    const copy = data.copies.find((entry) => entry.id === alert.copyId);
    if (copy) events.push({ id: alert.id, type: 'alert', occurredAt: alert.detectedAt, copy, book: data.books.find((book) => book.id === copy.bookId), alert });
  });
  data.books.filter((book) => !book.archivedAt && book.createdAt).forEach((book) => events.push({ id: `${book.id}-added`, type: 'new-book', occurredAt: book.createdAt, book }));
  return events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 8);
}
