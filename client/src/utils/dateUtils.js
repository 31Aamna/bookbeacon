import { FINE_POLICY } from '../data/finePolicy.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysFromNow(days, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', options).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function calendarDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function daysOverdue(dueAt, now = new Date()) {
  if (!dueAt) return 0;
  const dueDay = calendarDay(dueAt);
  const today = calendarDay(now);
  if (dueDay === null || today === null) return 0;
  return Math.max(0, today - dueDay);
}

export function daysRemaining(dueAt, now = new Date()) {
  if (!dueAt) return null;
  const dueDay = calendarDay(dueAt);
  const today = calendarDay(now);
  if (dueDay === null || today === null) return null;
  return dueDay - today;
}

export function transactionState(transaction, now = new Date()) {
  if (transaction.status === 'RETURNED' || transaction.returnedAt) return 'returned';
  const overdue = daysOverdue(transaction.dueAt, now);
  if (overdue > 0) return 'overdue';
  const remaining = daysRemaining(transaction.dueAt, now);
  if (remaining <= 3) return 'due-soon';
  return 'borrowed';
}

export function calculateFine(transaction, now = new Date()) {
  if (transaction.status === 'RETURNED' || transaction.returnedAt) return Number(transaction.fineAmount || 0);
  const overdueDays = Math.max(0, daysOverdue(transaction.dueAt, now) - FINE_POLICY.gracePeriodDays);
  return Number((overdueDays * FINE_POLICY.amountPerDay).toFixed(2));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));
}
