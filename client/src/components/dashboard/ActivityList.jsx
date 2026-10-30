import { ArrowUpRight, BookCheck, BookOpen, BookUp2, Clock3, QrCode, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../utils/dateUtils.js';
import { EmptyState } from '../common/States.jsx';

const EVENT_META = {
  issue: { label: 'Book issued', Icon: BookUp2, className: '' },
  return: { label: 'Return recorded', Icon: BookCheck, className: 'is-return' },
  scan: { label: 'QR scan recorded', Icon: QrCode, className: '' },
  alert: { label: 'Possible location mismatch', Icon: TriangleAlert, className: 'is-alert' },
  'new-book': { label: 'New title added', Icon: BookOpen, className: 'is-new' },
};

export default function ActivityList({ items = [], title = 'Recent activity', linkTo = '/librarian/circulation' }) {
  return <section className="panel-card activity-panel"><div className="panel-card__heading"><div><span className="eyebrow">LATEST UPDATES</span><h2>{title}</h2></div><Link to={linkTo} className="text-link">View all <ArrowUpRight size={15} /></Link></div>{items.length ? <div className="activity-list">{items.map((item) => { const meta = EVENT_META[item.type] || EVENT_META.issue; const Icon = meta.Icon; return <article className="activity-item" key={item.id}><span className={`activity-item__icon ${meta.className}`}><Icon size={16} /></span><div><strong>{meta.label}</strong><p>{item.book?.title || item.copy?.id || 'Library record'} <span>· {item.user?.name || item.copy?.id || 'Demo data'}</span></p></div><time><Clock3 size={13} />{formatDateTime(item.occurredAt)}</time></article>; })}</div> : <EmptyState title="No recent activity" description="Circulation and collection updates will appear here." />}</section>;
}
