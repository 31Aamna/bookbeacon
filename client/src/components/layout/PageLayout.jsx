import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import NotificationToast from '../common/NotificationToast.jsx';
import { useApp } from '../../hooks/useApp.js';

export default function PageLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { toasts, dismissToast } = useApp();
  return <div className="app-shell"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="app-shell__main"><Header onMenu={() => setMenuOpen(true)} /><main className="page-content"><Outlet /></main></div><NotificationToast toasts={toasts} dismiss={dismissToast} /></div>;
}
