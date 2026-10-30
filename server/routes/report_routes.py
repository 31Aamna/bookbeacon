from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from models.book import Book
from models.book_copy import BookCopy
from models.borrowing import BorrowingTransaction
from models.misplaced_alert import MisplacedAlert
from models.user import User
from models.scan_log import ScanLog
from services.borrowing_service import calculate_fine
from middleware.auth_middleware import librarian_required

report_bp = Blueprint('reports', __name__)


def _ok(data):
    return jsonify({'data': data}), 200


def _in_range(value: datetime, from_str: str, to_str: str) -> bool:
    if not value:
        return False
    # SQLite returns naive datetimes — treat them as UTC
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    if from_str:
        if value < datetime.fromisoformat(f'{from_str}T00:00:00').replace(tzinfo=timezone.utc):
            return False
    if to_str:
        if value > datetime.fromisoformat(f'{to_str}T23:59:59').replace(tzinfo=timezone.utc):
            return False
    return True



@report_bp.get('/summary')
@librarian_required
def get_summary(current_user):
    from_str = request.args.get('from', '').strip()
    to_str = request.args.get('to', '').strip()

    books = Book.query.filter(Book.archived_at == None).all()
    active_copies = BookCopy.query.filter(BookCopy.status != 'RETIRED').all()
    all_transactions = BorrowingTransaction.query.all()

    # Filter by date range if provided
    transactions = [
        t for t in all_transactions
        if not (from_str or to_str) or _in_range(t.issued_at, from_str, to_str)
    ]
    active_transactions = [t for t in all_transactions if t.status == 'ISSUED']

    # Copy availability
    available_count = sum(1 for c in active_copies if c.status == 'AVAILABLE')
    issued_count = sum(1 for c in active_copies if c.status == 'ISSUED')

    # Overdue
    now = datetime.now(timezone.utc)

    def is_overdue(t):
        if t.status != 'ISSUED' or not t.due_at:
            return False
        due = t.due_at
        if hasattr(due, 'tzinfo') and due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return (now.date() - due.date()).days > 0

    overdue_count = sum(1 for t in active_transactions if is_overdue(t))
    misplaced_count = MisplacedAlert.query.filter(MisplacedAlert.status != 'RESOLVED').count()
    registered_users = User.query.count()
    total_fine = sum(
        calculate_fine(t)
        for t in all_transactions
        if t.payment_status == 'UNPAID' or t.status == 'ISSUED'
    )

    # Category distribution
    category_map = {}
    for copy in active_copies:
        if copy.book and copy.book.category:
            cat = copy.book.category
            category_map[cat] = category_map.get(cat, 0) + 1
    categories = [{'name': k, 'value': v} for k, v in category_map.items() if v > 0]

    # Monthly activity (last 6 months)
    from collections import OrderedDict
    import calendar
    month_buckets = OrderedDict()
    for offset in range(5, -1, -1):
        d = datetime.now(timezone.utc)
        month = (d.month - offset - 1) % 12
        year = d.year + ((d.month - offset - 1) // 12)
        key = f'{year}-{str(month + 1).zfill(2)}'
        label = calendar.month_abbr[month + 1]
        month_buckets[key] = {'month': label, 'issues': 0, 'returns': 0}

    for t in transactions:
        if t.issued_at:
            issued = t.issued_at
            if hasattr(issued, 'tzinfo') and issued.tzinfo is None:
                issued = issued.replace(tzinfo=timezone.utc)
            key = f'{issued.year}-{str(issued.month).zfill(2)}'
            if key in month_buckets:
                month_buckets[key]['issues'] += 1
        if t.returned_at:
            ret = t.returned_at
            if hasattr(ret, 'tzinfo') and ret.tzinfo is None:
                ret = ret.replace(tzinfo=timezone.utc)
            key = f'{ret.year}-{str(ret.month).zfill(2)}'
            if key in month_buckets:
                month_buckets[key]['returns'] += 1

    # Most borrowed titles
    borrow_counts = {}
    for t in transactions:
        if t.copy and t.copy.book_id:
            borrow_counts[t.copy.book_id] = borrow_counts.get(t.copy.book_id, 0) + 1
    book_map = {b.id: b for b in books}
    most_borrowed = sorted(
        [{'book': book_map[bid].to_dict(), 'count': cnt}
         for bid, cnt in borrow_counts.items() if bid in book_map],
        key=lambda x: x['count'], reverse=True
    )[:5]

    # Recent transaction list for reports
    enriched_transactions = []
    for t in sorted(transactions, key=lambda x: x.issued_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)[:50]:
        td = t.to_dict()
        td['calculatedFine'] = calculate_fine(t)
        enriched_transactions.append(td)

    return _ok({
        'totalTitles': len(books),
        'totalCopies': len(active_copies),
        'availableCopies': available_count,
        'issuedCopies': issued_count,
        'overdueTransactions': overdue_count,
        'misplacedCopies': misplaced_count,
        'registeredUsers': registered_users,
        'totalFineBalance': round(total_fine, 2),
        'categories': categories,
        'activity': list(month_buckets.values()),
        'mostBorrowed': most_borrowed,
        'transactions': enriched_transactions,
    })


@report_bp.get('/activity')
@librarian_required
def get_activity(current_user):
    """Recent mixed activity feed for the librarian dashboard."""
    events = []
    transactions = BorrowingTransaction.query.order_by(
        BorrowingTransaction.issued_at.desc()
    ).limit(30).all()
    for t in transactions:
        copy = t.copy
        book = copy.book if copy else None
        user = t.user
        events.append({
            'id': f'{t.id}-issue',
            'type': 'issue',
            'occurredAt': t.issued_at.isoformat() if t.issued_at else None,
            'transaction': t.to_dict(include_related=False),
            'copy': copy.to_dict(include_location=False) if copy else None,
            'book': book.to_dict() if book else None,
            'user': user.to_dict() if user else None,
        })
        if t.returned_at:
            events.append({
                'id': f'{t.id}-return',
                'type': 'return',
                'occurredAt': t.returned_at.isoformat(),
                'transaction': t.to_dict(include_related=False),
                'copy': copy.to_dict(include_location=False) if copy else None,
                'book': book.to_dict() if book else None,
                'user': user.to_dict() if user else None,
            })

    scans = ScanLog.query.order_by(ScanLog.scanned_at.desc()).limit(20).all()
    for scan in scans:
        copy = scan.copy
        if copy:
            events.append({
                'id': scan.id,
                'type': 'scan',
                'occurredAt': scan.scanned_at.isoformat() if scan.scanned_at else None,
                'copy': copy.to_dict(include_location=False),
                'book': copy.book.to_dict() if copy.book else None,
                'scan': scan.to_dict(),
            })

    alerts = MisplacedAlert.query.order_by(MisplacedAlert.detected_at.desc()).limit(10).all()
    for alert in alerts:
        copy = alert.copy
        if copy:
            events.append({
                'id': alert.id,
                'type': 'alert',
                'occurredAt': alert.detected_at.isoformat() if alert.detected_at else None,
                'copy': copy.to_dict(include_location=False),
                'book': copy.book.to_dict() if copy.book else None,
                'alert': alert.to_dict(),
            })

    books = Book.query.filter(Book.archived_at == None, Book.created_at != None).order_by(
        Book.created_at.desc()
    ).limit(10).all()
    for book in books:
        events.append({
            'id': f'{book.id}-added',
            'type': 'new-book',
            'occurredAt': book.created_at.isoformat() if book.created_at else None,
            'book': book.to_dict(),
        })

    events.sort(key=lambda e: e.get('occurredAt') or '', reverse=True)
    return _ok(events[:8])
