from extensions import db
from datetime import datetime, timezone
import json


class InventoryAudit(db.Model):
    __tablename__ = 'inventory_audits'

    id = db.Column(db.String(32), primary_key=True)           # e.g. AUDIT-001
    started_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(16), nullable=False, default='COMPLETED')
    mode = db.Column(db.String(32), nullable=False, default='MANUAL')
    copy_count = db.Column(db.Integer, nullable=False, default=0)
    alerts_found = db.Column(db.Integer, nullable=False, default=0)
    note = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'startedAt': self.started_at.isoformat() if self.started_at else None,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'status': self.status,
            'mode': self.mode,
            'copyCount': self.copy_count,
            'alertsFound': self.alerts_found,
            'note': self.note,
        }

    def __repr__(self):
        return f'<InventoryAudit {self.id}>'
