import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;
    authService.getCurrentUser().then((current) => {
      if (mounted) setUser(current);
    }).catch((error) => {
      if (mounted) setAuthError(error.message || 'Could not restore the session.');
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setAuthError('');
    const current = await authService.login(identifier, password);
    setUser(current);
    return current;
  }, []);

  const register = useCallback(async (values) => {
    setAuthError('');
    const current = await authService.register(values);
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((updatedUser) => setUser(updatedUser), []);

  const value = useMemo(() => ({ user, loading, authError, setAuthError, login, register, logout, updateCurrentUser, isLibrarian: user?.role === 'librarian' }), [user, loading, authError, login, register, logout, updateCurrentUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
