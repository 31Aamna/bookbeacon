from extensions import db
from datetime import datetime, timezone


class Fine(db.Model):
    __tablename__ = 'fines'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.String(32), db.ForeignKey('borrowing_transactions.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    reason = db.Column(db.String(200), nullable=True)
    payment_status = db.Column(db.String(16), nullable=False, default='UNPAID')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    paid_at = db.Column(db.DateTime, nullable=True)

    transaction = db.relationship('BorrowingTransaction', back_populates='fines')

    def to_dict(self):
        return {
            'id': self.id,
            'transactionId': self.transaction_id,
            'amount': float(self.amount),
            'reason': self.reason,
            'paymentStatus': self.payment_status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'paidAt': self.paid_at.isoformat() if self.paid_at else None,
        }
