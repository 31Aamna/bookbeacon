import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Search } from 'lucide-react';
import { getMyBorrowedBooks } from '../services/borrowingService.js';
import { useAuth } from '../hooks/useAuth.js';
import { useApp } from '../hooks/useApp.js';
import { calculateFine, daysRemaining, formatCurrency, formatDate, transactionState } from '../utils/dateUtils.js';
import { PageHeading, LoadingSpinner, ErrorState, EmptyState } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';

const FILTERS = [{ id: 'all', label: 'All books' }, { id: 'borrowed', label: 'Currently borrowed' }, { id: 'due-soon', label: 'Due soon' }, { id: 'overdue', label: 'Overdue' }, { id: 'returned', label: 'Returned' }];

export default function MyBorrowedBooksPage() {
  const { user } = useAuth();
  const { revision } = useApp();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setLoading(true); getMyBorrowedBooks(user.id).then((items) => { if (active) setRecords(items); }).catch((issue) => { if (active) setError(issue.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user.id, revision]);
  const counts = Object.fromEntries(FILTERS.map((item) => [item.id, records.filter((record) => item.id === 'all' || transactionState(record) === item.id).length]));
  const filtered = useMemo(() => records.filter((record) => {
    const state = transactionState(record);
    const matchesFilter = filter === 'all' || state === filter;
    const matchesSearch = !query || `${record.book?.title} ${record.copy?.id}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [records, filter, query]);
  const outstanding = records.reduce((sum, record) => sum + ((record.paymentStatus === 'UNPAID' || record.status === 'ISSUED') ? calculateFine(record) : 0), 0);
  if (loading) return <LoadingSpinner label="Loading your borrowing records…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  return <div className="borrowed-page"><PageHeading eyebrow="YOUR READING HISTORY" title="My borrowed books" description="Keep track of the copies you have out, what’s coming due, and what you’ve returned." action={<div className="mini-metric"><span>ACTIVE LOANS</span><strong>{records.filter((record) => record.status === 'ISSUED').length}</strong></div>} /><div className="notice notice--info"><BookOpen size={17} /><span>Book returns are confirmed by a librarian at the circulation desk. This student view cannot mark a copy as returned.</span></div><div className="borrowed-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter borrowing records">{FILTERS.map((item) => <button role="tab" aria-selected={filter === item.id} className={filter === item.id ? 'is-active' : ''} key={item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{counts[item.id]}</span></button>)}</div><label className="search-field borrowed-search"><Search size={17} /><span className="sr-only">Search by title or Book ID</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or Book ID" /></label></div><div className="borrowed-list">{filtered.length ? filtered.map((record) => {
    const state = transactionState(record); const remaining = daysRemaining(record.dueAt);
    return <button className={`borrowed-record borrowed-record--${state}`} key={record.id} onClick={() => setSelected(record)}><span className="borrowed-record__cover"><BookIcon title={record.book?.title} /></span><span className="borrowed-record__main"><span className="eyebrow">{record.copy?.id} · {record.book?.category}</span><strong>{record.book?.title}</strong><small>{record.book?.authors?.join(', ')}</small></span><span className="borrowed-record__date"><small>ISSUED</small><strong>{formatDate(record.issuedAt)}</strong></span><span className="borrowed-record__date"><small>DUE DATE</small><strong>{formatDate(record.dueAt)}</strong>{record.status === 'ISSUED' ? <small className={state === 'overdue' ? 'text-danger' : state === 'due-soon' ? 'text-warning' : ''}>{remaining < 0 ? `${Math.abs(remaining)} days overdue` : `${remaining} days left`}</small> : null}</span><span className="borrowed-record__status"><StatusBadge status={state} label={state === 'borrowed' ? 'Borrowed' : state === 'due-soon' ? 'Due soon' : state === 'overdue' ? 'Overdue' : 'Returned'} /><span className="muted">{formatCurrency(calculateFine(record))}</span></span></button>;
  }) : <EmptyState title="No borrowing records match" description="Try another filter or search term." />}</div><div className="fine-summary-strip"><div><CalendarDays size={17} /><span><strong>{outstanding ? formatCurrency(outstanding) : 'No fines'}</strong><small>Outstanding demo fine balance</small></span></div><small>Rates are configurable demonstration values, not an institutional policy.</small></div><Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Borrowing record" size="md">{selected ? <div className="record-detail"><div className="eyebrow">{selected.id}</div><h3>{selected.book?.title}</h3><p>{selected.book?.authors?.join(', ')}</p><dl className="book-metadata"><div><dt>Physical copy</dt><dd>{selected.copy?.id}</dd></div><div><dt>Issue date</dt><dd>{formatDate(selected.issuedAt)}</dd></div><div><dt>Due date</dt><dd>{formatDate(selected.dueAt)}</dd></div><div><dt>Returned</dt><dd>{selected.returnedAt ? formatDate(selected.returnedAt) : 'Not yet returned'}</dd></div><div><dt>Fine</dt><dd>{formatCurrency(calculateFine(selected))} · demonstration policy</dd></div></dl><p className="notice notice--info">A librarian confirms returns in the circulation workflow; this record is read-only for students.</p><Button variant="secondary" onClick={() => setSelected(null)}>Close</Button></div> : null}</Modal></div>;
}

function BookIcon({ title = '' }) { return <span className="borrowed-book-mark" aria-label={title}><BookOpen size={21} /></span>; }
