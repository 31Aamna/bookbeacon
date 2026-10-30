from extensions import db
from models.notification import Notification
from services.borrowing_service import make_next_id


def get_notifications(user_id: str):
    return [
        n.to_dict()
        for n in Notification.query
            .filter_by(user_id=user_id)
            .order_by(Notification.created_at.desc())
            .all()
    ]


def mark_as_read(notification_id: str, user_id: str):
    note = Notification.query.get(notification_id)
    if not note:
        raise ValueError('That notification could not be found.')
    if note.user_id != user_id:
        raise PermissionError('You may only update your own notifications.')
    note.read = True
    db.session.commit()
    return note.to_dict()


def mark_all_as_read(user_id: str):
    Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
    db.session.commit()
    return True


def delete_notification(notification_id: str, user_id: str):
    note = Notification.query.get(notification_id)
    if not note:
        raise ValueError('That notification could not be found.')
    if note.user_id != user_id:
        raise PermissionError('You may only delete your own notifications.')
    db.session.delete(note)
    db.session.commit()
    return True
