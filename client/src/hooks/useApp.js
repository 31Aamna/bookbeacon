import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { getBooks } from '../services/bookService.js';

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider.');
  return value;
}

export function useBooks() {
  const { revision } = useApp();
  const [state, setState] = useState({ books: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    getBooks().then((books) => { if (active) setState({ books: books || [], loading: false, error: '' }); })
      .catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error: error.message || 'Could not load the catalogue.' })); });
    return () => { active = false; };
  }, [revision]);
  return state;
}
