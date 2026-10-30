from extensions import db
from datetime import datetime, timezone
import json


class MisplacedAlert(db.Model):
    __tablename__ = 'misplaced_alerts'

    id = db.Column(db.String(32), primary_key=True)           # e.g. ALERT-001
    copy_id = db.Column(db.String(32), db.ForeignKey('book_copies.id'), nullable=False, index=True)
    registered_location_id = db.Column(db.String(32), db.ForeignKey('shelves.id'), nullable=True)
    observed_location_id = db.Column(db.String(32), db.ForeignKey('shelves.id'), nullable=True)
    detected_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(16), nullable=False, default='NEW')
    # NEW | INVESTIGATING | RESOLVED
    confidence = db.Column(db.String(32), nullable=True, default='SIMULATED')
    resolution_history = db.Column(db.Text, nullable=True, default='[]')  # JSON list

    # Relationships
    copy = db.relationship('BookCopy', back_populates='misplaced_alerts')
    registered_shelf = db.relationship('Shelf', foreign_keys=[registered_location_id])
    observed_shelf = db.relationship('Shelf', foreign_keys=[observed_location_id])

    def get_resolution_history(self):
        try:
            return json.loads(self.resolution_history or '[]')
        except Exception:
            return []

    def add_resolution_event(self, action: str, actor: str):
        history = self.get_resolution_history()
        history.append({'at': datetime.now(timezone.utc).isoformat(), 'action': action, 'actor': actor})
        self.resolution_history = json.dumps(history)

    def to_dict(self):
        return {
            'id': self.id,
            'copyId': self.copy_id,
            'registeredLocationId': self.registered_location_id,
            'observedLocationId': self.observed_location_id,
            'detectedAt': self.detected_at.isoformat() if self.detected_at else None,
            'status': self.status,
            'confidence': self.confidence,
            'resolutionHistory': self.get_resolution_history(),
            'copy': self.copy.to_dict(include_location=False) if self.copy else None,
            'book': self.copy.book.to_dict() if self.copy and self.copy.book else None,
            'registeredLocation': self.registered_shelf.to_dict() if self.registered_shelf else None,
            'observedLocation': self.observed_shelf.to_dict() if self.observed_shelf else None,
        }

    def __repr__(self):
        return f'<MisplacedAlert {self.id} [{self.status}]>'
