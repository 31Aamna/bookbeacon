import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData } from './mockStore.js';

export async function getNotifications(userId) {
  if (isApiMode()) return apiRequest('/notifications');
  const data = getMockData();
  return data.notifications.filter((notice) => !userId || notice.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function markAsRead(id) {
  if (isApiMode()) return apiRequest(`/notifications/${encodeURIComponent(id)}`, { method: 'PATCH', body: { read: true } });
  return updateMockData((data) => {
    const notice = data.notifications.find((entry) => entry.id === id);
    if (!notice) throw new Error('That notification could not be found.');
    notice.read = true;
    return notice;
  });
}

export async function markAllAsRead(userId) {
  if (isApiMode()) return apiRequest('/notifications/read-all', { method: 'PATCH' });
  return updateMockData((data) => {
    data.notifications.filter((notice) => !userId || notice.userId === userId).forEach((notice) => { notice.read = true; });
    return true;
  });
}

export async function clearNotification(id) {
  if (isApiMode()) return apiRequest(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return updateMockData((data) => {
    data.notifications = data.notifications.filter((notice) => notice.id !== id);
    return true;
  });
}
