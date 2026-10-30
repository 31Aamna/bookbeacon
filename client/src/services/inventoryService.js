import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData, makeId } from './mockStore.js';

function enrichAlert(alert, data) {
  const copy = data.copies.find((entry) => entry.id === alert.copyId);
  const book = data.books.find((entry) => entry.id === copy?.bookId);
  const registeredLocation = data.locations.find((entry) => entry.id === alert.registeredLocationId);
  const observedLocation = data.locations.find((entry) => entry.id === alert.observedLocationId);
  return { ...alert, copy, book, registeredLocation, observedLocation };
}

function enrichScan(scan, data) {
  const copy = data.copies.find((entry) => entry.id === scan.copyId);
  return { ...scan, copy, book: data.books.find((entry) => entry.id === copy?.bookId), registeredLocation: data.locations.find((entry) => entry.id === scan.registeredLocationId), observedLocation: data.locations.find((entry) => entry.id === scan.observedLocationId) || null };
}

export async function getInventory() {
  if (isApiMode()) return apiRequest('/inventory');
  const data = getMockData();
  return data.copies.filter((copy) => copy.status !== 'RETIRED').map((copy) => ({
    ...copy,
    book: data.books.find((book) => book.id === copy.bookId),
    location: data.locations.find((location) => location.id === copy.locationId) || null,
    scanLogs: data.scanLogs.filter((scan) => scan.copyId === copy.id).sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt)).map((scan) => enrichScan(scan, data)),
  }));
}

export async function getMisplacedBooks() {
  if (isApiMode()) return apiRequest('/inventory/misplaced');
  const data = getMockData();
  return data.misplacedAlerts.map((alert) => enrichAlert(alert, data)).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
}

export async function getScanLogs() {
  if (isApiMode()) return apiRequest('/scans');
  const data = getMockData();
  return data.scanLogs.map((scan) => enrichScan(scan, data)).sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
}

export async function updateAlertStatus(id, status) {
  if (isApiMode()) return apiRequest(`/inventory/misplaced/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
  return updateMockData((data) => {
    const alert = data.misplacedAlerts.find((entry) => entry.id === id);
    if (!alert) throw new Error('That location alert could not be found.');
    if (alert.status === 'RESOLVED') throw new Error('Resolved alerts are read-only; create a new scan record to open another review.');
    if (status === 'RESOLVED') throw new Error('Use the simulated shelf-verification workflow to resolve a location alert.');
    if (!['NEW', 'INVESTIGATING'].includes(status)) throw new Error('Choose a valid alert status.');
    alert.status = status;
    if (status === 'INVESTIGATING') alert.resolutionHistory.push({ at: new Date().toISOString(), action: 'Marked under investigation', actor: 'Maya Thompson' });
    return enrichAlert(alert, data);
  });
}

export async function verifyAlert(id, verifiedLocationId) {
  if (isApiMode()) return apiRequest(`/inventory/misplaced/${encodeURIComponent(id)}/verify`, { method: 'POST', body: { verifiedLocationId } });
  return updateMockData((data) => {
    const alert = data.misplacedAlerts.find((entry) => entry.id === id);
    if (!alert) throw new Error('That location alert could not be found.');
    if (alert.status === 'RESOLVED') throw new Error('Resolved alerts are read-only; create a new scan record to open another review.');
    const at = new Date().toISOString();
    if (verifiedLocationId === alert.registeredLocationId) {
      alert.status = 'RESOLVED';
      alert.resolutionHistory.push({ at, action: 'Simulated verification matched registered shelf; alert resolved', actor: 'Maya Thompson' });
    } else {
      alert.status = 'INVESTIGATING';
      alert.confidence = 'SIMULATED_MISMATCH';
      alert.resolutionHistory.push({ at, action: 'Simulated verification still differs from registered shelf', actor: 'Maya Thompson' });
    }
    return enrichAlert(alert, data);
  });
}

export async function runAudit() {
  if (isApiMode()) return apiRequest('/inventory/audit', { method: 'POST', body: { mode: 'run' } });
  return updateMockData((data) => {
    const run = { id: makeId('AUDIT', data.auditRuns), startedAt: new Date().toISOString(), copyCount: data.copies.filter((copy) => copy.status !== 'RETIRED').length, alertsFound: data.misplacedAlerts.filter((alert) => alert.status !== 'RESOLVED').length, mode: 'SIMULATED_SEEDED_RECORDS', note: 'This audit summarizes seeded demonstration records; the browser did not physically scan shelves.' };
    data.auditRuns.unshift(run);
    return run;
  });
}
