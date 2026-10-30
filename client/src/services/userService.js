import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData } from './mockStore.js';
import { calculateFine } from '../utils/dateUtils.js';

function enrichUser(user, data) {
  const transactions = data.transactions.filter((entry) => entry.userId === user.id);
  const active = transactions.filter((entry) => entry.status === 'ISSUED');
  const outstandingFines = active.reduce((sum, entry) => sum + calculateFine(entry), 0) + transactions.filter((entry) => entry.status === 'RETURNED' && entry.paymentStatus === 'UNPAID').reduce((sum, entry) => sum + Number(entry.fineAmount || 0), 0);
  return { ...user, activeBorrowings: active.length, outstandingFines: Number(outstandingFines.toFixed(2)), borrowingHistory: transactions.length };
}

export async function getUsers() {
  if (isApiMode()) return apiRequest('/users');
  const data = getMockData();
  return data.users.map((user) => enrichUser(user, data));
}

export async function getUserById(id) {
  if (isApiMode()) return apiRequest(`/users/${encodeURIComponent(id)}`);
  const data = getMockData();
  const user = data.users.find((entry) => entry.id === id);
  return user ? enrichUser(user, data) : null;
}

export async function updateUser(id, patch) {
  if (isApiMode()) return apiRequest(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
  return updateMockData((data) => {
    const user = data.users.find((entry) => entry.id === id);
    if (!user) throw new Error('That account could not be found.');
    if (patch.email && data.users.some((entry) => entry.id !== id && entry.email.toLowerCase() === patch.email.trim().toLowerCase())) throw new Error('Another account already uses that email address.');
    Object.assign(user, patch);
    return enrichUser(user, data);
  });
}
