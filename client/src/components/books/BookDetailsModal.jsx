import { useEffect, useState } from 'react';
import { MapPin, QrCode } from 'lucide-react';
import { getBookById } from '../../services/bookService.js';
import { formatDateTime } from '../../utils/dateUtils.js';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { BookCover } from './BookCard.jsx';

export default function BookDetailsModal({ bookId, onClose, onFind }) {
  const [book, setBook] = useState(null);
  useEffect(() => { if (bookId) getBookById(bookId).then(setBook).catch(() => setBook(null)); }, [bookId]);
  return <Modal open={Boolean(bookId)} onClose={onClose} title={book?.title || 'Book details'} size="lg">
    {!book ? <p className="muted">Loading book details…</p> : <div className="book-detail-modal"><BookCover book={book} /><div><div className="eyebrow">{book.category} · {book.publicationYear || 'Edition not listed'}</div><h3>{book.title}</h3><p>{book.description}</p><p className="muted">{book.authors?.join(', ')}{book.publisher ? ` · ${book.publisher}` : ''}</p><div className="copy-list">{book.copies?.map((copy) => <div className="copy-row" key={copy.id}><span><strong>{copy.id}</strong><small>{copy.location?.zoneName} · Section {copy.location?.sectionCode} · {copy.location?.shelfCode}</small><small>Last scan {formatDateTime(copy.lastScannedAt)}</small></span><span className="copy-row__end"><StatusBadge status={copy.status.toLowerCase()} />{copy.status === 'AVAILABLE' ? <Button variant="secondary" size="sm" icon={MapPin} onClick={() => onFind(copy)}>Find on map</Button> : null}</span></div>)}</div>{book.availableCopies === 0 ? <p className="notice notice--warning">No copies are currently available to locate.</p> : null}</div></div>}
  </Modal>;
}
