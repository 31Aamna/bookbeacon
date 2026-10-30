import { createContext, useCallback, useMemo, useState } from 'react';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [revision, setRevision] = useState(0);
  const [toasts, setToasts] = useState([]);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const dismissToast = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => dismissToast(id), 4200);
    return id;
  }, [dismissToast]);
  const value = useMemo(() => ({ revision, refresh, toasts, notify, dismissToast }), [revision, refresh, toasts, notify, dismissToast]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
