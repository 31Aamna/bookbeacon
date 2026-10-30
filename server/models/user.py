from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(32), primary_key=True)          # e.g. USER-001
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    identifier = db.Column(db.String(64), nullable=False, unique=True, index=True)  # student/staff ID
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(16), nullable=False, default='student')  # student | librarian
    department = db.Column(db.String(128), nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    joined_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    transactions = db.relationship('BorrowingTransaction', back_populates='user', lazy='dynamic')
    notifications = db.relationship('Notification', back_populates='user', lazy='dynamic')

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'identifier': self.identifier,
            'role': self.role,
            'department': self.department,
            'active': self.active,
            'joinedAt': self.joined_at.isoformat() if self.joined_at else None,
        }
        return data

    def __repr__(self):
        return f'<User {self.id} {self.email}>'
