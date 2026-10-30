from extensions import db
from datetime import datetime, timezone


class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.String(32), primary_key=True)           # e.g. BOOK-001
    title = db.Column(db.String(400), nullable=False, index=True)
    authors = db.Column(db.Text, nullable=False)              # JSON-encoded list
    isbn = db.Column(db.String(20), nullable=True, index=True)
    category = db.Column(db.String(128), nullable=True, index=True)
    publisher = db.Column(db.String(200), nullable=True)
    publication_year = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    cover_color = db.Column(db.String(16), nullable=True)
    cover_accent = db.Column(db.String(16), nullable=True)
    archived_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    copies = db.relationship('BookCopy', back_populates='book', lazy='dynamic')

    def get_authors(self):
        import json
        try:
            return json.loads(self.authors)
        except Exception:
            return [self.authors] if self.authors else []

    def set_authors(self, authors_list):
        import json
        if isinstance(authors_list, list):
            self.authors = json.dumps(authors_list)
        elif isinstance(authors_list, str):
            # Support comma-separated string
            self.authors = json.dumps([a.strip() for a in authors_list.split(',') if a.strip()])
        else:
            self.authors = json.dumps([])

    def to_dict(self, include_copies=False):
        data = {
            'id': self.id,
            'title': self.title,
            'authors': self.get_authors(),
            'isbn': self.isbn,
            'category': self.category,
            'publisher': self.publisher,
            'publicationYear': self.publication_year,
            'description': self.description,
            'coverColor': self.cover_color,
            'coverAccent': self.cover_accent,
            'archivedAt': self.archived_at.isoformat() if self.archived_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }
        if include_copies:
            active_copies = [c for c in self.copies if c.status != 'RETIRED']
            data['copies'] = [c.to_dict() for c in active_copies]
            data['availableCopies'] = sum(1 for c in active_copies if c.status == 'AVAILABLE')
            data['totalCopies'] = len(active_copies)
        else:
            active_copies = [c for c in self.copies if c.status != 'RETIRED']
            data['availableCopies'] = sum(1 for c in active_copies if c.status == 'AVAILABLE')
            data['totalCopies'] = len(active_copies)
        return data

    def __repr__(self):
        return f'<Book {self.id} "{self.title}">'
