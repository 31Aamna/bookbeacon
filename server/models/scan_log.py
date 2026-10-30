from extensions import db
from datetime import datetime, timezone


class ScanLog(db.Model):
    __tablename__ = 'scan_logs'

    id = db.Column(db.String(32), primary_key=True)           # e.g. SCAN-001
    copy_id = db.Column(db.String(32), db.ForeignKey('book_copies.id'), nullable=False, index=True)
    transaction_id = db.Column(db.String(32), db.ForeignKey('borrowing_transactions.id'), nullable=True, index=True)
    registered_location_id = db.Column(db.String(32), db.ForeignKey('shelves.id'), nullable=True)
    observed_location_id = db.Column(db.String(32), db.ForeignKey('shelves.id'), nullable=True)
    scanned_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    scan_type = db.Column(db.String(32), nullable=False)
    # ISSUE | RETURN | INVENTORY | MANUAL_DEMO | QR_SCAN
    verification_status = db.Column(db.String(48), nullable=False, default='IDENTIFIER_FOUND_NOT_PHYSICALLY_VERIFIED')
    # MATCH | MISMATCH | IDENTIFIER_FOUND_NOT_PHYSICALLY_VERIFIED | SIMULATED_MISMATCH

    # Relationships
    copy = db.relationship('BookCopy', back_populates='scan_logs')
    transaction = db.relationship('BorrowingTransaction', back_populates='scan_logs')
    registered_shelf = db.relationship('Shelf', foreign_keys=[registered_location_id])
    observed_shelf = db.relationship('Shelf', foreign_keys=[observed_location_id])

    def to_dict(self):
        data = {
            'id': self.id,
            'copyId': self.copy_id,
            'transactionId': self.transaction_id,
            'registeredLocationId': self.registered_location_id,
            'observedLocationId': self.observed_location_id,
            'scannedAt': self.scanned_at.isoformat() if self.scanned_at else None,
            'scanType': self.scan_type,
            'verificationStatus': self.verification_status,
        }
        if self.copy:
            data['copy'] = self.copy.to_dict(include_location=False)
            if self.copy.book:
                data['book'] = self.copy.book.to_dict()
            else:
                data['book'] = None
        else:
            data['copy'] = None
            data['book'] = None
        data['registeredLocation'] = self.registered_shelf.to_dict() if self.registered_shelf else None
        data['observedLocation'] = self.observed_shelf.to_dict() if self.observed_shelf else None
        return data

    def __repr__(self):
        return f'<ScanLog {self.id} {self.scan_type}>'
