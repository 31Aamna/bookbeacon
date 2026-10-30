import { useEffect, useState } from 'react';
import { Bell, Check, ChevronDown, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useApp } from '../../hooks/useApp.js';
import { clearNotification, getNotifications, markAllAsRead, markAsRead } from '../../services/notificationService.js';
import { formatDateTime } from '../../utils/dateUtils.js';
import { getInitials } from '../../utils/formatters.js';

const TITLES = {
  '/student/dashboard': 'Your dashboard', '/books': 'Search books', '/borrowed': 'My borrowed books', '/due-fines': 'Due dates & fines', '/map': 'Library map', '/scan': 'Scan a book', '/profile': 'My profile',
  '/librarian/dashboard': 'Library overview', '/librarian/books': 'Manage books', '/librarian/copies': 'Manage copies', '/librarian/circulation': 'Circulation desk', '/librarian/inventory': 'Inventory audit', '/librarian/misplaced': 'Misplaced books', '/librarian/scans': 'Scan logs', '/librarian/users': 'Manage users', '/librarian/reports': 'Reports & analytics',
};

function NotificationMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const { revision, refresh, notify } = useApp();
  const navigate = useNavigate();
  useEffect(() => { getNotifications(user?.id).then(setItems).catch(() => setItems([])); }, [user?.id, revision, open]);
  const unread = items.filter((item) => !item.read).length;
  const readOne = async (item) => { try { await markAsRead(item.id); refresh(); if (item.path) navigate(item.path); setOpen(false); } catch (error) { notify(error.message, 'error'); } };
  const readAll = async () => { try { await markAllAsRead(user?.id); refresh(); notify('All notifications marked as read.'); } catch (error) { notify(error.message, 'error'); } };
  const clearOne = async (event, id) => { event.stopPropagation(); try { await clearNotification(id); refresh(); } catch (error) { notify(error.message, 'error'); } };
  return <div className="header-popover-wrap"><button className="header-icon-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Bell size={19} />{unread ? <span className="notification-count">{unread}</span> : null}</button>{open ? <><button className="popover-dismiss" aria-label="Close notifications" onClick={() => setOpen(false)} /><div className="notification-popover"><div className="notification-popover__head"><div><strong>Notifications</strong><span>{unread ? `${unread} unread` : 'You’re all caught up'}</span></div><button className="text-button" onClick={readAll} disabled={!unread}>Mark all read</button></div><div className="notification-popover__list">{items.length ? items.slice(0, 8).map((item) => <div className={`notification-item ${item.read ? '' : 'is-unread'}`} key={item.id}><button className="notification-item__main" onClick={() => readOne(item)}><span className={`notification-item__dot notification-item__dot--${item.type}`} /><span><strong>{item.title}</strong><small>{item.message}</small><time>{formatDateTime(item.createdAt)}</time></span></button><button className="icon-button notification-item__clear" aria-label={`Clear ${item.title}`} onClick={(event) => clearOne(event, item.id)}><X size={14} /></button></div>) : <div className="notification-empty"><Check size={18} /><p>No notifications yet.</p></div>}</div></div></> : null}</div>;
}

export default function Header({ onMenu }) {
  const { user, logout } = useAuth();
  const { notify } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const title = TITLES[location.pathname] || (location.pathname.startsWith('/books/') ? 'Book details' : 'BookBeacon');
  const handleLogout = async () => { try { await logout(); navigate('/'); } catch (error) { notify(error.message, 'error'); } };
  return <header className="app-header"><div className="app-header__left"><button className="header-menu-button" aria-label="Open navigation" onClick={onMenu}><Menu size={21} /></button><div><span className="app-header__overline">BOOKBEACON / {user?.role === 'librarian' ? 'LIBRARY SERVICES' : 'STUDENT PORTAL'}</span><h1>{title}</h1></div></div><div className="app-header__right"><Link to="/books" className="header-search-shortcut"><Search size={16} /><span>Search the catalogue</span><kbd>⌘ K</kbd></Link><NotificationMenu user={user} /><div className="header-profile-wrap"><button className={`header-profile ${profileOpen ? 'is-open' : ''}`} aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}><span className="avatar">{getInitials(user?.name)}</span><span className="header-profile__name"><strong>{user?.name}</strong><small>{user?.role === 'librarian' ? 'Librarian' : 'Student'}</small></span><ChevronDown size={15} /></button>{profileOpen ? <div className="profile-popover"><Link to="/profile" onClick={() => setProfileOpen(false)}><UserRound size={16} />My profile</Link><button onClick={handleLogout}><LogOut size={16} />Sign out</button></div> : null}</div></div></header>;
}
