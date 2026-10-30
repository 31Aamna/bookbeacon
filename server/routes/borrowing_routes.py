from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.borrowing import BorrowingTransaction
from models.book_copy import BookCopy
from middleware.auth_middleware import jwt_required_custom, librarian_required
from services import borrowing_service
from services.borrowing_service import calculate_fine

borrowing_bp = Blueprint('borrowings', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


def _enrich(t: BorrowingTransaction):
    """Add derivedState and calculatedFine to a transaction dict."""
    data = t.to_dict()
    data['calculatedFine'] = calculate_fine(t)
    # Replicate frontend transactionState logic
    if t.status == 'RETURNED' or t.returned_at:
        data['derivedState'] = 'returned'
    else:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        due = t.due_at
        if due:
            if hasattr(due, 'tzinfo') and due.tzinfo is None:
                from datetime import timezone as tz
                due = due.replace(tzinfo=tz.utc)
            days_over = max(0, (now.date() - due.date()).days)
            days_left = (due.date() - now.date()).days
        else:
            days_over = 0
            days_left = 99
        if days_over > 0:
            data['derivedState'] = 'overdue'
        elif days_left <= 3:
            data['derivedState'] = 'due-soon'
        else:
            data['derivedState'] = 'borrowed'
    return data


@borrowing_bp.get('')
@librarian_required
def get_all_transactions(current_user):
    status_filter = request.args.get('status', '').strip()
    query = BorrowingTransaction.query.order_by(BorrowingTransaction.issued_at.desc())
    transactions = query.all()
    enriched = [_enrich(t) for t in transactions]
    if status_filter == 'overdue':
        enriched = [t for t in enriched if t.get('derivedState') == 'overdue']
    return _ok(enriched)


@borrowing_bp.get('/my')
@jwt_required_custom
def get_my_borrowed_books(current_user):
    transactions = (
        BorrowingTransaction.query
        .filter_by(user_id=current_user.id)
        .order_by(BorrowingTransaction.issued_at.desc())
        .all()
    )
    return _ok([_enrich(t) for t in transactions])


@borrowing_bp.post('/issue')
@librarian_required
def issue_book(current_user):
    payload = request.get_json(silent=True) or {}
    user_id = str(payload.get('userId', '')).strip()
    copy_id = str(payload.get('copyId', '')).strip()
    due_at = payload.get('dueAt')
    loan_days = current_app.config.get('LOAN_DAYS', 14)

    if not user_id or not copy_id:
        return jsonify({'message': 'userId and copyId are required.'}), 422

    try:
        transaction = borrowing_service.issue_book(
            user_id=user_id, copy_id=copy_id,
            due_at=due_at, loan_days=loan_days,
        )
        db.session.commit()
        return _ok(_enrich(transaction), 201)
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 409


@borrowing_bp.post('/return')
@librarian_required
def return_book(current_user):
    payload = request.get_json(silent=True) or {}
    copy_id = str(payload.get('copyId', '')).strip()
    observed_location_id = payload.get('observedLocationId') or None
    actor_name = current_user.name or 'Librarian'

    if not copy_id:
        return jsonify({'message': 'copyId is required.'}), 422

    try:
        result = borrowing_service.return_book(
            copy_id=copy_id,
            observed_location_id=observed_location_id,
            actor_name=actor_name,
        )
        db.session.commit()
        return _ok({
            'transaction': _enrich(result['transaction']),
            'mismatch': result['mismatch'],
            'scan': result['scan'].to_dict(),
        })
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 409
