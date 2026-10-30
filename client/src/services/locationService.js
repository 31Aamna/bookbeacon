import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData } from './mockStore.js';

export async function getLibraryMap() {
  if (isApiMode()) return apiRequest('/locations/map');
  return getMockData().libraryMap;
}

export async function getZones() {
  if (isApiMode()) return apiRequest('/locations');
  return getMockData().libraryMap.zones;
}

export async function getShelves() {
  if (isApiMode()) return apiRequest('/locations/shelves');
  return getMockData().locations;
}

export async function getLocationById(id) {
  if (isApiMode()) return apiRequest(`/locations/${encodeURIComponent(id)}`);
  return getMockData().locations.find((location) => location.id === id) || null;
}

export function formatLocationBreadcrumb(location) {
  if (!location) return 'Location not registered';
  return `${location.libraryName || 'Engineering Library'} → Zone ${location.zoneCode} → Section ${location.sectionCode} → Shelf ${location.shelfCode}`;
}
