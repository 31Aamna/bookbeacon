from extensions import db
from datetime import datetime, timezone


class BorrowingTransaction(db.Model):
    __tablename__ = 'borrowing_transactions'

    id = db.Column(db.String(32), primary_key=True)           # e.g. TXN-001
    user_id = db.Column(db.String(32), db.ForeignKey('users.id'), nullable=False, index=True)
    copy_id = db.Column(db.String(32), db.ForeignKey('book_copies.id'), nullable=False, index=True)
    issued_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    due_at = db.Column(db.DateTime, nullable=False)
    returned_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(16), nullable=False, default='ISSUED')
    # ISSUED | RETURNED
    fine_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    payment_status = db.Column(db.String(16), nullable=False, default='NONE')
    # NONE | UNPAID | PAID

    # Relationships
    user = db.relationship('User', back_populates='transactions')
    copy = db.relationship('BookCopy', back_populates='transactions')
    scan_logs = db.relationship('ScanLog', back_populates='transaction', lazy='dynamic')
    fines = db.relationship('Fine', back_populates='transaction', lazy='dynamic')

    def to_dict(self, include_related=True):
        data = {
            'id': self.id,
            'userId': self.user_id,
            'copyId': self.copy_id,
            'issuedAt': self.issued_at.isoformat() if self.issued_at else None,
            'dueAt': self.due_at.isoformat() if self.due_at else None,
            'returnedAt': self.returned_at.isoformat() if self.returned_at else None,
            'status': self.status,
            'fineAmount': float(self.fine_amount),
            'paymentStatus': self.payment_status,
        }
        if include_related:
            if self.copy:
                data['copy'] = self.copy.to_dict()
                if self.copy.book:
                    data['book'] = self.copy.book.to_dict()
                else:
                    data['book'] = None
                if self.copy.shelf:
                    data['location'] = self.copy.shelf.to_dict()
                else:
                    data['location'] = None
            else:
                data['copy'] = None
                data['book'] = None
                data['location'] = None
            if self.user:
                data['user'] = self.user.to_dict()
            else:
                data['user'] = None
        return data

    def __repr__(self):
        return f'<BorrowingTransaction {self.id} [{self.status}]>'
