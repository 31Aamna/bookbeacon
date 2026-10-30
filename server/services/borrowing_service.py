from datetime import datetime, timezone, timedelta
from flask import current_app
from extensions import db
from models.user import User
from models.borrowing import BorrowingTransaction
from models.book_copy import BookCopy
from models.fine import Fine
from models.notification import Notification
from models.scan_log import ScanLog


def _days_overdue(due_at: datetime) -> int:
    if not due_at:
        return 0
    now = datetime.now(timezone.utc)
    # SQLite returns naive datetimes — treat them as UTC
    if due_at.tzinfo is None:
        due_at = due_at.replace(tzinfo=timezone.utc)
    due_day = due_at.replace(hour=0, minute=0, second=0, microsecond=0)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    diff = (today - due_day).days
    return max(0, diff)



def calculate_fine(transaction: BorrowingTransaction) -> float:
    """Calculate accruing fine for a transaction using the configured policy."""
    if transaction.status == 'RETURNED' or transaction.returned_at:
        return float(transaction.fine_amount or 0)
    grace = current_app.config.get('FINE_GRACE_PERIOD_DAYS', 0)
    rate = current_app.config.get('FINE_PER_DAY', 0.50)
    overdue = max(0, _days_overdue(transaction.due_at) - grace)
    return round(overdue * rate, 2)


def make_next_id(model, prefix: str) -> str:
    """Generate next sequential ID e.g. TXN-011."""
    import re
    records = db.session.query(model.id).all()
    numbers = []
    for (rid,) in records:
        m = re.search(r'(\d+)$', rid or '')
        if m:
            numbers.append(int(m.group(1)))
    nxt = max(numbers, default=0) + 1
    return f"{prefix}-{str(nxt).zfill(3)}"


def issue_book(*, user_id: str, copy_id: str, due_at=None, loan_days: int = 14) -> BorrowingTransaction:
    """Issue a copy to a user. Raises ValueError on business-rule violations."""
    user = User.query.get(user_id)
    if not user or not user.active or user.role != 'student':
        raise ValueError('Select an active student account before issuing a copy.')

    copy = BookCopy.query.with_for_update().get(copy_id)
    if not copy:
        raise ValueError('That physical copy could not be found.')
    if copy.status != 'AVAILABLE':
        raise ValueError('This copy is not available to issue. Choose an available copy.')

    # Prevent duplicate active issues
    active = BorrowingTransaction.query.filter_by(copy_id=copy_id, status='ISSUED').first()
    if active:
        raise ValueError('This copy already has an active borrowing transaction.')

    now = datetime.now(timezone.utc)
    if due_at is None:
        due_at = now + timedelta(days=loan_days)
    elif isinstance(due_at, str):
        due_at = datetime.fromisoformat(due_at.replace('Z', '+00:00'))

    txn_id = make_next_id(BorrowingTransaction, 'TXN')
    transaction = BorrowingTransaction(
        id=txn_id,
        user_id=user_id,
        copy_id=copy_id,
        issued_at=now,
        due_at=due_at,
        status='ISSUED',
        fine_amount=0,
        payment_status='NONE',
    )
    copy.status = 'ISSUED'
    copy.last_scanned_at = now

    scan = ScanLog(
        id=make_next_id(ScanLog, 'SCAN'),
        copy_id=copy.id,
        transaction_id=txn_id,
        registered_location_id=copy.shelf_id,
        observed_location_id=copy.shelf_id,
        scanned_at=now,
        scan_type='ISSUE',
        verification_status='MATCH',
    )

    note = Notification(
        id=make_next_id(Notification, 'NOTE'),
        user_id=user_id,
        title='Book checked out',
        message=f'Your copy {copy.id} has been issued. Please return it by {due_at.strftime("%b %d, %Y")}.',
        type='issue',
        path='/borrowed',
    )

    db.session.add_all([transaction, scan, note])
    return transaction


def return_book(*, copy_id: str, observed_location_id: str = None, actor_name: str = 'Librarian'):
    """Return a copy. Creates fine, scan log, and mismatch alert if needed."""
    from models.misplaced_alert import MisplacedAlert

    copy = BookCopy.query.with_for_update().get(copy_id)
    if not copy:
        raise ValueError('That physical copy could not be found.')

    transaction = BorrowingTransaction.query.filter_by(
        copy_id=copy_id, status='ISSUED'
    ).with_for_update().first()
    if not transaction:
        raise ValueError('No active borrowing transaction was found for that copy.')

    now = datetime.now(timezone.utc)
    fine_amount = calculate_fine(transaction)
    mismatch = bool(observed_location_id and observed_location_id != copy.shelf_id)

    transaction.status = 'RETURNED'
    transaction.returned_at = now
    transaction.fine_amount = fine_amount
    transaction.payment_status = 'UNPAID' if fine_amount > 0 else 'NONE'

    copy.status = 'AVAILABLE'
    copy.last_scanned_at = now

    scan = ScanLog(
        id=make_next_id(ScanLog, 'SCAN'),
        copy_id=copy.id,
        transaction_id=transaction.id,
        registered_location_id=copy.shelf_id,
        observed_location_id=observed_location_id or copy.shelf_id,
        scanned_at=now,
        scan_type='RETURN',
        verification_status='SIMULATED_MISMATCH' if mismatch else 'MATCH',
    )
    db.session.add(scan)

    if mismatch:
        existing = MisplacedAlert.query.filter(
            MisplacedAlert.copy_id == copy_id,
            MisplacedAlert.status != 'RESOLVED',
        ).first()
        if not existing:
            alert = MisplacedAlert(
                id=make_next_id(MisplacedAlert, 'ALERT'),
                copy_id=copy.id,
                registered_location_id=copy.shelf_id,
                observed_location_id=observed_location_id,
                status='NEW',
                confidence='SIMULATED',
                resolution_history='[]',
            )
            db.session.add(alert)

    book_title = copy.book.title if copy.book else 'Your book'
    note = Notification(
        id=make_next_id(Notification, 'NOTE'),
        user_id=transaction.user_id,
        title='Return recorded',
        message=f'{book_title} was recorded as returned by {actor_name}.',
        type='return',
        path='/borrowed',
    )
    db.session.add(note)

    return {'transaction': transaction, 'mismatch': mismatch, 'scan': scan}
