import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, LayoutGrid, List, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useBooks } from '../hooks/useApp.js';
import { getInventory } from '../services/inventoryService.js';
import { useApp } from '../hooks/useApp.js';
import { formatCurrency } from '../utils/dateUtils.js';
import { PageHeading } from '../components/common/States.jsx';
import Button from '../components/common/Button.jsx';
import { SelectField } from '../components/common/DataTable.jsx';
import BookCard from '../components/books/BookCard.jsx';
import { BookCover } from '../components/books/BookCard.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { EmptyState, LoadingSpinner, ErrorState } from '../components/common/States.jsx';

export default function SearchBooksPage() {
  const { books, loading, error } = useBooks();
  const { revision } = useApp();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [availability, setAvailability] = useState('');
  const [zone, setZone] = useState('');
  const [section, setSection] = useState('');
  const [shelf, setShelf] = useState('');
  const [sort, setSort] = useState('title-asc');
  const [view, setView] = useState('grid');
  const [limit, setLimit] = useState(9);
  const [inventory, setInventory] = useState([]);
  useEffect(() => { setQuery(params.get('q') || ''); }, [params]);
  useEffect(() => { getInventory().then(setInventory).catch(() => setInventory([])); }, [revision, location.key]);
  const categoryOptions = [...new Set(books.map((book) => book.category))].sort();
  const authorOptions = [...new Set(books.flatMap((book) => book.authors))].sort();
  const filtered = useMemo(() => {
    let list = books.filter((book) => {
      const queryMatch = !query || `${book.title} ${book.authors.join(' ')} ${book.category} ${book.isbn} ${book.id}`.toLowerCase().includes(query.toLowerCase());
      const copies = inventory.filter((copy) => copy.bookId === book.id);
      const availMatch = !availability || (availability === 'available' ? copies.some((copy) => copy.status === 'AVAILABLE') : availability === 'unavailable' ? !copies.some((copy) => copy.status === 'AVAILABLE') : copies.some((copy) => copy.status === availability.toUpperCase()));
      const locMatch = !zone || copies.some((copy) => copy.location?.zoneCode === zone || copy.locationId?.includes(`-${zone}-`));
      const secMatch = !section || copies.some((copy) => copy.location?.sectionCode === section);
      const shelfMatch = !shelf || copies.some((copy) => copy.location?.shelfCode === shelf);
      return queryMatch && (!category || book.category === category) && (!author || book.authors.includes(author)) && availMatch && locMatch && secMatch && shelfMatch;
    });
    const compare = { 'title-asc': (a, b) => a.title.localeCompare(b.title), 'title-desc': (a, b) => b.title.localeCompare(a.title), author: (a, b) => a.authors[0].localeCompare(b.authors[0]), recent: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) }[sort];
    return [...list].sort(compare);
  }, [books, inventory, query, category, author, availability, zone, section, shelf, sort]);
  const activeFilters = category || author || availability || zone || section || shelf || query;
  const clearFilters = () => { setQuery(''); setCategory(''); setAuthor(''); setAvailability(''); setZone(''); setSection(''); setShelf(''); setParams({}); setLimit(9); };
  const findBook = (book) => { const copy = inventory.find((item) => item.bookId === book.id && item.status === 'AVAILABLE'); if (copy) navigate('/map', { state: { copy: { ...copy, book } } }); else navigate(`/books/${book.id}`); };
  if (loading) return <LoadingSpinner label="Loading the catalogue…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  return <div className="catalogue-page"><PageHeading eyebrow="ENGINEERING LIBRARY CATALOGUE" title="Find something worth reading." description="Search by title, author, subject or copy ID. Every available copy has its own shelf location." action={<div className="catalogue-search-count"><strong>{filtered.length}</strong><span>titles to explore</span></div>} /><div className="catalogue-search-row"><form className="search-field catalogue-search" role="search" onSubmit={(event) => { event.preventDefault(); setParams(query ? { q: query } : {}); }}><span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="catalogue-query">Search books by title, author, ISBN, category or Book ID</label><input id="catalogue-query" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(9); }} placeholder="Search by title, author, ISBN, subject or Book ID" /><button type="submit">Search</button></form><div className="catalogue-controls"><SelectField label="Sort by" value={sort} onChange={setSort} options={[{ value: 'title-asc', label: 'Title A–Z' }, { value: 'title-desc', label: 'Title Z–A' }, { value: 'author', label: 'Author' }, { value: 'recent', label: 'Recently added' }]} /><div className="view-toggle" aria-label="Choose results view"><button aria-label="Grid view" aria-pressed={view === 'grid'} className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}><LayoutGrid size={17} /></button><button aria-label="List view" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}><List size={17} /></button></div></div></div>
    <section className="catalogue-layout"><aside className="filter-panel"><div className="filter-panel__head"><span><SlidersHorizontal size={16} /> Filters</span>{activeFilters ? <button className="text-button" onClick={clearFilters}>Clear all</button> : null}</div><SelectField label="Category" value={category} onChange={(value) => { setCategory(value); setLimit(9); }} options={[{ value: '', label: 'All categories' }, ...categoryOptions.map((value) => ({ value, label: value }))]} /><SelectField label="Author" value={author} onChange={setAuthor} options={[{ value: '', label: 'All authors' }, ...authorOptions.map((value) => ({ value, label: value }))]} /><SelectField label="Availability" value={availability} onChange={setAvailability} options={[{ value: '', label: 'Any status' }, { value: 'available', label: 'Available now' }, { value: 'unavailable', label: 'No copies available' }, { value: 'issued', label: 'Issued copies' }, { value: 'maintenance', label: 'Under maintenance' }]} /><SelectField label="Zone" value={zone} onChange={setZone} options={[{ value: '', label: 'All zones' }, ...['A', 'B', 'C'].map((value) => ({ value, label: `Zone ${value}` }))]} /><SelectField label="Section" value={section} onChange={setSection} options={[{ value: '', label: 'All sections' }, ...['01','02','03','04','05','06','07','08','09'].map((value) => ({ value, label: `Section ${value}` }))]} /><SelectField label="Shelf" value={shelf} onChange={setShelf} options={[{ value: '', label: 'All shelves' }, ...inventory.map((copy) => copy.location?.shelfCode).filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).sort().map((value) => ({ value, label: value }))]} /><div className="filter-map-tip"><MapPin size={17} /><p>Each physical copy has its own location. Open a title to choose a specific available copy.</p><Link to="/map">Explore the map →</Link></div></aside><div className="catalogue-results"><div className="catalogue-results__top"><span>Showing <strong>{Math.min(filtered.length, limit)}</strong> of <strong>{filtered.length}</strong> titles</span>{activeFilters ? <button className="clear-filter-link" onClick={clearFilters}><X size={14} />Clear filters</button> : null}</div>{filtered.length ? <div className={`book-grid ${view === 'list' ? 'book-grid--list' : ''}`}>{filtered.slice(0, limit).map((book) => <BookCard key={book.id} book={book} onFind={findBook} />)}</div> : <EmptyState title="No books match those filters" description="Try another title or clear one or more filters." action={{ label: 'Clear filters', onClick: clearFilters }} />}{filtered.length > limit ? <div className="load-more"><Button variant="secondary" icon={ArrowDownWideNarrow} onClick={() => setLimit((value) => value + 6)}>Load more titles</Button></div> : null}</div></section>
    <div className="catalogue-note"><span>BOOKBEACON DEMO</span><p>Availability and locations are shown from sample records. Shelf verification and catalogue updates are demonstration workflows.</p></div>
  </div>;
}
