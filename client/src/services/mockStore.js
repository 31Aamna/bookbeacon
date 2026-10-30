import { createInitialData, MOCK_DATA_VERSION } from '../data/mockData.js';

const STORE_KEY = 'bookbeacon.mock-data';
let memoryFallback = null;

function parseStoredValue() {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return memoryFallback;
  }
}

function persist(value) {
  memoryFallback = value;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch { /* Memory fallback keeps the demo usable in restricted contexts. */ }
}

export function getMockData() {
  const existing = parseStoredValue();
  if (!existing || existing.version !== MOCK_DATA_VERSION) {
    const initial = createInitialData();
    persist(initial);
    return initial;
  }
  memoryFallback = existing;
  return existing;
}

export function updateMockData(updater) {
  const data = getMockData();
  const result = updater(data);
  persist(data);
  return result;
}

export function resetMockData() {
  const data = createInitialData();
  persist(data);
  return data;
}

export function makeId(prefix, records = []) {
  const numbers = records.map((record) => Number(String(record.id || '').match(/(\d+)$/)?.[1] || 0));
  const next = Math.max(0, ...numbers) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
