import { useEffect, useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatLocationBreadcrumb } from '../../services/locationService.js';

export function BookCover({ book, compact = false }) {
  const title = book?.title || 'Book';
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [book?.coverImage]);
  return <div className={`book-cover ${compact ? 'book-cover--compact' : ''}`} style={{ '--cover': book?.coverColor || '#315b64', '--cover-accent': book?.coverAccent || '#d9eadf' }} aria-label={`Cover illustration for ${title}`} role="img">{book?.coverImage && !failed ? <img className="book-cover__image" src={book.coverImage} alt="" loading="lazy" onError={() => setFailed(true)} /> : <><span className="book-cover__top">BOOKBEACON COLLECTION</span><span className="book-cover__ornament" aria-hidden="true" /><span className="book-cover__title">{title}</span><span className="book-cover__author">{book?.authors?.[0] || 'Library edition'}</span><span className="book-cover__bottom">{book?.category || 'COLLECTION'}</span></>}</div>;
}

export default function BookCard({ book, onFind }) {
  const available = Number(book.availableCopies || 0);
  const displayCopy = book.copies?.find((copy) => copy.status === 'AVAILABLE') || book.copies?.[0];
  return <article className="book-card"><Link to={`/books/${book.id}`} className="book-card__cover-link" aria-label={`View details for ${book.title}`}><BookCover book={book} /></Link><div className="book-card__content"><div className="book-card__topline"><span className="eyebrow">{book.category}</span><StatusBadge status={available > 0 ? 'available' : 'unavailable'} label={available > 0 ? 'Available' : 'All copies out'} /></div><Link to={`/books/${book.id}`} className="book-card__title">{book.title}</Link><p className="book-card__author">{book.authors?.join(', ')}</p><p className="book-card__meta">ISBN {book.isbn}</p><p className="book-card__meta">{displayCopy ? `Copy ${displayCopy.id} · ${formatLocationBreadcrumb(displayCopy.location)}` : 'No physical copy is registered'}</p><p className="book-card__meta">{book.availableCopies} of {book.totalCopies} copies available</p><div className="book-card__actions"><Button variant="secondary" size="sm" icon={MapPin} onClick={() => onFind?.(book)}>Find a copy</Button><Link className="icon-button book-card__detail" to={`/books/${book.id}`} aria-label={`Open ${book.title} details`}><ArrowUpRight size={17} /></Link></div></div></article>;
}
