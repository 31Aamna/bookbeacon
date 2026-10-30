import { BookOpen, ChartNoAxesCombined, CircleHelp, ClipboardCheck, ClipboardList, FileChartColumn, LayoutDashboard, LibraryBig, MapPinned, ScanLine, Search, Settings2, Users, X, CreditCard, BookCopy, ArrowLeftRight, PackageSearch, TriangleAlert, QrCode } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/books', label: 'Search books', icon: Search },
  { to: '/borrowed', label: 'My borrowed books', icon: BookCopy },
  { to: '/due-fines', label: 'Due dates & fines', icon: CreditCard },
  { to: '/map', label: 'Library map', icon: MapPinned },
  { to: '/scan', label: 'Scan QR', icon: QrCode },
];

const LIBRARIAN_LINKS = [
  { to: '/librarian/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/librarian/books', label: 'Manage books', icon: BookOpen },
  { to: '/librarian/copies', label: 'Manage copies', icon: BookCopy },
  { to: '/librarian/circulation', label: 'Circulation', icon: ArrowLeftRight },
  { to: '/librarian/inventory', label: 'Inventory audit', icon: ClipboardCheck },
  { to: '/librarian/misplaced', label: 'Misplaced books', icon: TriangleAlert },
  { to: '/librarian/scans', label: 'Scan logs', icon: ScanLine },
  { to: '/librarian/users', label: 'Users', icon: Users },
  { to: '/librarian/reports', label: 'Reports', icon: FileChartColumn },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 34 34" fill="none"><path d="M7 6.5h9.2c3 0 5.2 2.2 5.2 5.2v15.8c0-2.4-1.9-4.1-4.4-4.1H7V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M27 6.5h-5.1v16.9H27V6.5Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="22" cy="11.7" r="2.2" fill="#c9a66b"/></svg></span>;
}

export { BrandMark };

export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth();
  const librarian = user?.role === 'librarian';
  const links = librarian ? LIBRARIAN_LINKS : STUDENT_LINKS;
  return <>
    {open ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} /> : null}
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__brand"><Link to={librarian ? '/librarian/dashboard' : '/student/dashboard'} onClick={onClose}><BrandMark /><span><strong>BookBeacon</strong><small>SMART LIBRARY</small></span></Link><button className="icon-button sidebar__close" aria-label="Close navigation" onClick={onClose}><X size={18} /></button></div>
      <div className="sidebar__section-label">{librarian ? 'LIBRARY OPERATIONS' : 'YOUR LIBRARY'}</div>
      <nav className="sidebar__nav">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Misplaced books' ? <span className="sidebar__dot" aria-label="Needs attention" /> : null}</NavLink>)}</nav>
      {!librarian ? <div className="sidebar__map-card"><div className="sidebar__map-icon"><MapPinned size={18} /></div><strong>Know before you go</strong><p>Every available copy has a shelf to find.</p><Link to="/map" onClick={onClose}>Open library map <span>→</span></Link></div> : null}
      <div className="sidebar__footer"><div className="sidebar__status"><span />{librarian ? 'Demo workspace' : 'Engineering Library'}</div><span className="sidebar__prototype">FRONTEND PROTOTYPE</span></div>
    </aside>
  </>;
}
