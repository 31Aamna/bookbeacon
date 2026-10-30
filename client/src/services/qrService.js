import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData, makeId } from './mockStore.js';
import { normalizeIdentifier } from '../utils/validation.js';

function enrichCopy(copy, data) {
  const book = data.books.find((entry) => entry.id === copy.bookId);
  const location = data.locations.find((entry) => entry.id === copy.locationId) || null;
  return { ...copy, book, location };
}

export async function lookupCopy(identifier) {
  if (isApiMode()) return apiRequest(`/scans/lookup?identifier=${encodeURIComponent(identifier)}`);
  const data = getMockData();
  const normalized = normalizeIdentifier(identifier);
  const copy = data.copies.find((entry) => normalizeIdentifier(entry.id) === normalized || normalizeIdentifier(entry.qrCode) === normalized);
  return copy ? enrichCopy(copy, data) : null;
}

export async function verifyScan(identifier, { observedLocationId = null, scanType = 'MANUAL_DEMO' } = {}) {
  if (isApiMode()) return apiRequest('/scans/verify', { method: 'POST', body: { identifier, observedLocationId, scanType } });
  return updateMockData((data) => {
    const normalized = normalizeIdentifier(identifier);
    const copy = data.copies.find((entry) => normalizeIdentifier(entry.id) === normalized || normalizeIdentifier(entry.qrCode) === normalized);
    if (!copy) return { valid: false, message: 'No registered copy matches that Book ID or QR identifier.' };
    const mismatch = Boolean(observedLocationId && observedLocationId !== copy.locationId);
    const scannedAt = new Date().toISOString();
    const scan = {
      id: makeId('SCAN', data.scanLogs), copyId: copy.id,
      registeredLocationId: copy.locationId,
      observedLocationId: observedLocationId || null,
      scannedAt, scanType,
      verificationStatus: mismatch ? 'SIMULATED_MISMATCH' : observedLocationId ? 'MATCH' : 'IDENTIFIER_FOUND_NOT_PHYSICALLY_VERIFIED',
      transactionId: null,
    };
    data.scanLogs.unshift(scan);
    copy.lastScannedAt = scannedAt;
    if (mismatch && !data.misplacedAlerts.some((alert) => alert.copyId === copy.id && alert.status !== 'RESOLVED')) {
      data.misplacedAlerts.unshift({ id: makeId('ALERT', data.misplacedAlerts), copyId: copy.id, registeredLocationId: copy.locationId, observedLocationId, detectedAt: scannedAt, status: 'NEW', confidence: 'SIMULATED', resolutionHistory: [] });
    }
    return { valid: true, copy: enrichCopy(copy, data), scan, mismatch, simulated: true, message: mismatch ? 'Simulated location mismatch. This is not an authoritative physical verification.' : 'Copy identifier found. Physical shelf location has not been verified.' };
  });
}
