from extensions import db
from datetime import datetime, timezone


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(32), primary_key=True)           # e.g. NOTE-001
    user_id = db.Column(db.String(32), db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(32), nullable=False, default='info')
    # issue | return | due | overdue | fine | alert | scan | info
    path = db.Column(db.String(200), nullable=True)
    read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'path': self.path,
            'read': self.read,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Notification {self.id}>'
