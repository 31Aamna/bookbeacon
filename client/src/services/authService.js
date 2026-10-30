import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData, makeId } from './mockStore.js';
import { isEmail, isRequired, validatePassword } from '../utils/validation.js';

const SESSION_KEY = 'bookbeacon.session';
export const DEMO_PASSWORD = 'Beacon2026!';
const runtimeCredentials = new Map();

function saveSession(user, token = null) {
  const session = { userId: user.id, role: user.role, token, user };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* Session stays in memory in restricted contexts. */ }
  return user;
}

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export async function login(identifier, password) {
  if (isApiMode()) {
    const result = await apiRequest('/auth/login', { method: 'POST', body: { identifier, password } });
    if (!result?.user) throw new Error('The API did not return an authenticated user.');
    return saveSession(result.user, result.token || result.access_token || null);
  }
  if (!isRequired(identifier) || !isRequired(password)) throw new Error('Enter your email or ID and password.');
  const data = getMockData();
  const normalized = String(identifier).trim().toLowerCase();
  const user = data.users.find((entry) => entry.email.toLowerCase() === normalized || entry.identifier.toLowerCase() === normalized);
  const expected = runtimeCredentials.get(user?.email.toLowerCase()) || (['student@bookbeacon.demo', 'librarian@bookbeacon.demo'].includes(user?.email.toLowerCase()) ? DEMO_PASSWORD : null);
  if (!user || !user.active || expected !== password) throw new Error('Those details do not match an active demo account. Check the demo credentials and try again.');
  return saveSession(user);
}

export async function register(values) {
  if (isApiMode()) {
    const result = await apiRequest('/auth/register', { method: 'POST', body: values });
    if (!result?.user) throw new Error('The API did not return a registered user.');
    return saveSession(result.user, result.token || result.access_token || null);
  }
  const errors = {};
  if (!isRequired(values.fullName)) errors.fullName = 'Enter your full name.';
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.';
  if (!isRequired(values.identifier)) errors.identifier = 'Enter your student or staff ID.';
  if (!isRequired(values.department)) errors.department = 'Enter your department.';
  if (!validatePassword(values.password)) errors.password = 'Use at least 8 characters.';
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!values.acceptTerms) errors.acceptTerms = 'Please acknowledge the demo terms.';
  if (Object.keys(errors).length) {
    const error = new Error('Please correct the highlighted registration fields.');
    error.fieldErrors = errors;
    throw error;
  }

  const email = values.email.trim().toLowerCase();
  const user = updateMockData((data) => {
    if (data.users.some((entry) => entry.email.toLowerCase() === email || entry.identifier.toLowerCase() === values.identifier.trim().toLowerCase())) {
      throw new Error('An account already uses this email or ID. Try signing in instead.');
    }
    const entry = {
      id: makeId('USER', data.users),
      name: values.fullName.trim(),
      email,
      identifier: values.identifier.trim(),
      role: 'student',
      department: values.department.trim(),
      active: true,
      joinedAt: new Date().toISOString(),
    };
    data.users.push(entry);
    return entry;
  });
  runtimeCredentials.set(email, values.password);
  return saveSession(user);
}

export async function logout() {
  if (isApiMode()) {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } finally { localStorage.removeItem(SESSION_KEY); }
    return;
  }
  try { localStorage.removeItem(SESSION_KEY); } catch { /* No-op when storage is restricted. */ }
}

export async function getCurrentUser() {
  if (isApiMode()) {
    const session = readSession();
    if (!session) return null;
    const result = await apiRequest('/auth/me');
    return result?.user || result || null;
  }
  const session = readSession();
  if (!session?.userId) return null;
  return getMockData().users.find((user) => user.id === session.userId && user.active) || null;
}

export function getStoredSession() {
  return readSession();
}
