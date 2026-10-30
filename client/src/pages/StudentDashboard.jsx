import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookCheck, CalendarClock, Coins, LibraryBig, MapPin, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyBorrowedBooks } from '../services/borrowingService.js';
import { getBooks } from '../services/bookService.js';
import { getInventory } from '../services/inventoryService.js';
import { calculateFine, formatDate, formatCurrency, transactionState } from '../utils/dateUtils.js';
import { useAuth } from '../hooks/useAuth.js';
import { useApp } from '../hooks/useApp.js';
import SummaryCard from '../components/dashboard/SummaryCard.jsx';
import BookCard from '../components/books/BookCard.jsx';
import LibraryMap from '../components/library-map/LibraryMap.jsx';
import Button from '../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingSpinner, PageHeading } from '../components/common/States.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { revision } = useApp();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCopy, setSelectedCopy] = useState(null);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([getMyBorrowedBooks(user.id), getBooks(), getInventory()]).then(([borrowings, titles, inventory]) => {
      if (!active) return; setLoans(borrowings || []); setBooks(titles || []); setCopies(inventory || []);
      const suggested = inventory?.find((copy) => copy.status === 'AVAILABLE'); setSelectedCopy(suggested || null);
    }).catch((issue) => { if (active) setError(issue.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id, revision]);
  const activeLoans = loans.filter((loan) => loan.status === 'ISSUED');
  const now = new Date();
  const overdueLoans = activeLoans.filter((loan) => transactionState(loan, now) === 'overdue');
  const nextDue = [...activeLoans].filter((loan) => transactionState(loan, now) !== 'overdue').sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0];
  const fineTotal = loans.reduce((sum, loan) => sum + ((loan.paymentStatus === 'UNPAID' || loan.status === 'ISSUED') ? calculateFine(loan) : 0), 0);
  const returnsThisMonth = loans.filter((loan) => loan.returnedAt && new Date(loan.returnedAt).getMonth() === now.getMonth() && new Date(loan.returnedAt).getFullYear() === now.getFullYear()).length;
  const results = useMemo(() => books.filter((book) => !query || `${book.title} ${book.authors.join(' ')} ${book.category} ${book.isbn} ${book.id}`.toLowerCase().includes(query.toLowerCase())).slice(0, 3), [books, query]);
  const findCopy = (book) => {
    const copy = book.copies?.find((item) => item.status === 'AVAILABLE');
    if (copy) { setSelectedCopy({ ...copy, book }); document.getElementById('dashboard-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else navigate(`/books/${book.id}`);
  };
  if (loading) return <LoadingSpinner label="Preparing your library overview…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  return <div className="student-dashboard"><PageHeading eyebrow="YOUR CAMPUS LIBRARY" title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}.`} description="Here’s what’s happening with your books, and what you might want to read next." action={<Button variant="secondary" icon={LibraryBig} onClick={() => navigate('/books')}>Browse catalogue</Button>} />
    <div className="summary-grid summary-grid--student"><SummaryCard label="Borrowed books" value={activeLoans.length} detail={`${overdueLoans.length} overdue`} icon={BookCheck} tone="teal" to="/borrowed" actionLabel="View all borrowed books" /><SummaryCard label="Next due date" value={nextDue ? formatDate(nextDue.dueAt) : overdueLoans.length ? 'No upcoming date' : 'All clear'} detail={nextDue?.book?.title || (overdueLoans.length ? `${overdueLoans.length} overdue · review due dates` : 'No active due dates')} icon={CalendarClock} tone="amber" to="/due-fines" actionLabel="View due dates" /><SummaryCard label="Fine status" value={fineTotal ? formatCurrency(fineTotal) : 'No fines'} detail={fineTotal ? 'Demo policy balance' : 'Your balance is clear'} icon={Coins} tone={fineTotal ? 'rose' : 'green'} to="/due-fines" actionLabel="View fine details" /><SummaryCard label="Returns this month" value={returnsThisMonth} detail="From your circulation history" icon={Sparkles} tone="blue" to="/borrowed" actionLabel="View your reading history" /></div>
    <div className="dashboard-content-grid"><section className="panel-card dashboard-search-panel"><div className="panel-card__heading"><div><span className="eyebrow">FIND YOUR NEXT READ</span><h2>Search the collection</h2></div><button className="text-link" onClick={() => navigate('/books')}>All books <ArrowRight size={15} /></button></div><form className="dashboard-search" onSubmit={(event) => { event.preventDefault(); navigate(`/books?q=${encodeURIComponent(query)}`); }}><Search size={18} /><label className="sr-only" htmlFor="dashboard-search">Search books by title, author, ISBN or Book ID</label><input id="dashboard-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a title, author, subject or ID" /><button type="submit" aria-label="Search catalogue"><ArrowRight size={17} /></button></form><div className="dashboard-search__meta"><span>{query ? 'Matching titles' : 'A few titles to explore'}</span><span>15+ titles in collection</span></div><div className="dashboard-book-results">{results.map((book) => <BookCard key={book.id} book={book} onFind={findCopy} />)}{!results.length ? <EmptyState title="No titles found" description="Try another title, author, subject or identifier." /> : null}</div><button className="browse-link" onClick={() => navigate(`/books${query ? `?q=${encodeURIComponent(query)}` : ''}`)}>Explore the full catalogue <ArrowRight size={16} /></button></section>
      <section className="panel-card dashboard-map-panel" id="dashboard-map"><div className="panel-card__heading"><div><span className="eyebrow">SHELF-LEVEL WAYFINDING</span><h2>Your library map</h2></div><button className="icon-button" aria-label="Open full library map" onClick={() => navigate('/map', { state: { copy: selectedCopy } })}><ArrowRight size={18} /></button></div><div className="dashboard-map-copy"><div><MapPin size={15} /><span>Selected destination</span></div><strong>{selectedCopy?.book?.title || 'Introduction to Algorithms'}</strong><small>{selectedCopy?.id || 'BB-2048'} · {selectedCopy?.locationId?.replace('SHELF-', 'Shelf ') || 'Shelf A-04'}</small></div><LibraryMap compact selectedCopy={selectedCopy} selectedLocationId={selectedCopy?.locationId} onSelectLocation={(locationId) => { const copy = copies.find((item) => item.locationId === locationId && item.status === 'AVAILABLE'); if (copy) setSelectedCopy({ ...copy, book: copy.book }); }} /><div className="dashboard-map-footer"><span><StatusBadge status="available" label="Available copy" /></span><button className="text-link" onClick={() => navigate('/map', { state: { copy: selectedCopy } })}>Open full map <ArrowRight size={15} /></button></div></section></div>
  </div>;
}
