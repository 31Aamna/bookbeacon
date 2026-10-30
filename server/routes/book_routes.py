from flask import Blueprint, request, jsonify
from extensions import db
from models.book import Book
from models.book_copy import BookCopy
from services.borrowing_service import make_next_id
from middleware.auth_middleware import jwt_required_custom, librarian_required
from datetime import datetime, timezone
import json

book_bp = Blueprint('books', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


@book_bp.get('')
def list_books():
    q = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    query = Book.query.filter(Book.archived_at == None)
    if q:
        needle = f'%{q}%'
        query = query.filter(
            db.or_(
                Book.title.ilike(needle),
                Book.authors.ilike(needle),
                Book.isbn.ilike(needle),
                Book.category.ilike(needle),
                Book.publisher.ilike(needle),
                Book.id.ilike(needle),
            )
        )
    if category:
        query = query.filter(Book.category.ilike(f'%{category}%'))
    books = query.order_by(Book.created_at.desc()).all()
    return _ok([b.to_dict(include_copies=True) for b in books])


@book_bp.get('/<book_id>')
def get_book(book_id):
    book = Book.query.get(book_id)
    if not book or book.archived_at:
        return jsonify({'message': 'That title could not be found.'}), 404
    return _ok(book.to_dict(include_copies=True))


@book_bp.post('')
@librarian_required
def create_book(current_user):
    payload = request.get_json(silent=True) or {}
    errors = {}
    title = str(payload.get('title', '')).strip()
    isbn = str(payload.get('isbn', '')).strip()
    category = str(payload.get('category', '')).strip()
    # Accept "author" (string) or "authors" (list) from frontend
    author_raw = payload.get('author') or payload.get('authors') or ''

    if not title:
        errors['title'] = 'Enter a book title.'
    if not isbn:
        errors['isbn'] = 'Enter an ISBN.'
    if not category:
        errors['category'] = 'Choose a category.'
    if not author_raw:
        errors['author'] = 'Enter at least one author.'
    pub_year = payload.get('publicationYear')
    if pub_year:
        try:
            pub_year = int(pub_year)
            if pub_year < 1000 or pub_year > datetime.now(timezone.utc).year + 1:
                errors['publicationYear'] = 'Enter a valid publication year.'
        except (ValueError, TypeError):
            errors['publicationYear'] = 'Enter a valid publication year.'
    if errors:
        return jsonify({'message': 'Please correct the highlighted book fields.', 'fieldErrors': errors}), 422

    book = Book(
        id=make_next_id(Book, 'BOOK'),
        title=title,
        isbn=isbn,
        category=category,
        publisher=str(payload.get('publisher', '')).strip() or None,
        publication_year=pub_year or None,
        description=str(payload.get('description', '')).strip() or None,
        cover_color=str(payload.get('coverColor', '')).strip() or None,
        cover_accent=str(payload.get('coverAccent', '')).strip() or None,
    )
    book.set_authors(author_raw)
    db.session.add(book)
    db.session.commit()
    return _ok(book.to_dict(include_copies=True), 201)


@book_bp.patch('/<book_id>')
@librarian_required
def update_book(book_id, current_user):
    book = Book.query.get(book_id)
    if not book or book.archived_at:
        return jsonify({'message': 'That title could not be found.'}), 404
    payload = request.get_json(silent=True) or {}
    if 'title' in payload:
        book.title = str(payload['title']).strip()
    if 'isbn' in payload:
        book.isbn = str(payload['isbn']).strip()
    if 'category' in payload:
        book.category = str(payload['category']).strip()
    if 'publisher' in payload:
        book.publisher = str(payload['publisher']).strip() or None
    if 'publicationYear' in payload:
        book.publication_year = int(payload['publicationYear']) if payload['publicationYear'] else None
    if 'description' in payload:
        book.description = str(payload['description']).strip() or None
    if 'coverColor' in payload:
        book.cover_color = str(payload['coverColor']).strip() or None
    if 'coverAccent' in payload:
        book.cover_accent = str(payload['coverAccent']).strip() or None
    author_raw = payload.get('author') or payload.get('authors')
    if author_raw:
        book.set_authors(author_raw)
    db.session.commit()
    return _ok(book.to_dict(include_copies=True))


@book_bp.delete('/<book_id>')
@librarian_required
def delete_book(book_id, current_user):
    book = Book.query.get(book_id)
    if not book or book.archived_at:
        return jsonify({'message': 'That title could not be found.'}), 404
    # Check for active loans on any copy of this book
    copy_ids = [c.id for c in book.copies]
    from models.borrowing import BorrowingTransaction
    active = BorrowingTransaction.query.filter(
        BorrowingTransaction.copy_id.in_(copy_ids),
        BorrowingTransaction.status == 'ISSUED'
    ).first()
    if active:
        return jsonify({'message': 'This title has an active borrowing transaction and cannot be deleted yet.'}), 409
    # Retire copies that have history, fully remove copies without history
    from models.borrowing import BorrowingTransaction as TXN
    for copy in list(book.copies):
        has_history = TXN.query.filter_by(copy_id=copy.id).first()
        if has_history:
            copy.status = 'RETIRED'
        else:
            db.session.delete(copy)
    book.archived_at = datetime.now(timezone.utc)
    db.session.commit()
    return _ok(True)
