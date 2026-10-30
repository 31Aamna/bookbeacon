from extensions import db
from datetime import datetime, timezone


class BookCopy(db.Model):
    __tablename__ = 'book_copies'

    id = db.Column(db.String(32), primary_key=True)           # e.g. BB-2048  (Book ID)
    book_id = db.Column(db.String(32), db.ForeignKey('books.id'), nullable=False, index=True)
    qr_code = db.Column(db.String(64), nullable=False, unique=True, index=True)  # same as id by default
    status = db.Column(db.String(16), nullable=False, default='AVAILABLE')
    # AVAILABLE | ISSUED | MAINTENANCE | RETIRED
    shelf_id = db.Column(db.String(32), db.ForeignKey('shelves.id'), nullable=True, index=True)
    last_scanned_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    book = db.relationship('Book', back_populates='copies')
    shelf = db.relationship('Shelf', back_populates='copies')
    transactions = db.relationship('BorrowingTransaction', back_populates='copy', lazy='dynamic')
    scan_logs = db.relationship('ScanLog', back_populates='copy', lazy='dynamic')
    misplaced_alerts = db.relationship('MisplacedAlert', back_populates='copy', lazy='dynamic')

    @property
    def location_id(self):
        """Frontend uses locationId — alias for shelf_id."""
        return self.shelf_id

    def to_dict(self, include_location=True):
        data = {
            'id': self.id,
            'bookId': self.book_id,
            'qrCode': self.qr_code,
            'status': self.status,
            'locationId': self.shelf_id,
            'lastScannedAt': self.last_scanned_at.isoformat() if self.last_scanned_at else None,
        }
        if include_location and self.shelf:
            data['location'] = self.shelf.to_dict()
        else:
            data['location'] = None
        return data

    def __repr__(self):
        return f'<BookCopy {self.id} [{self.status}]>'
