from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.borrowing import BorrowingTransaction
from services.borrowing_service import calculate_fine
from middleware.auth_middleware import jwt_required_custom, librarian_required

user_bp = Blueprint('users', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


def _enrich_user(user: User):
    transactions = BorrowingTransaction.query.filter_by(user_id=user.id).all()
    active = [t for t in transactions if t.status == 'ISSUED']
    outstanding_fines = sum(calculate_fine(t) for t in active) + sum(
        float(t.fine_amount or 0) for t in transactions
        if t.status == 'RETURNED' and t.payment_status == 'UNPAID'
    )
    data = user.to_dict()
    data['activeBorrowings'] = len(active)
    data['outstandingFines'] = round(outstanding_fines, 2)
    data['borrowingHistory'] = len(transactions)
    return data


@user_bp.get('')
@librarian_required
def get_users(current_user):
    users = User.query.all()
    return _ok([_enrich_user(u) for u in users])


@user_bp.get('/<user_id>')
@jwt_required_custom
def get_user(user_id, current_user):
    # Students may only fetch their own record
    if current_user.role != 'librarian' and current_user.id != user_id:
        return jsonify({'message': 'You may only view your own account.'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'That account could not be found.'}), 404
    return _ok(_enrich_user(user))


@user_bp.patch('/<user_id>')
@jwt_required_custom
def update_user(user_id, current_user):
    if current_user.role != 'librarian' and current_user.id != user_id:
        return jsonify({'message': 'You may only update your own account.'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'That account could not be found.'}), 404
    payload = request.get_json(silent=True) or {}

    # Prevent non-librarians from changing role or active status
    if current_user.role != 'librarian':
        payload.pop('role', None)
        payload.pop('active', None)

    if 'email' in payload:
        new_email = str(payload['email']).strip().lower()
        existing = User.query.filter(User.email == new_email, User.id != user_id).first()
        if existing:
            return jsonify({'message': 'Another account already uses that email address.'}), 409
        user.email = new_email
    if 'name' in payload:
        user.name = str(payload['name']).strip()
    if 'department' in payload:
        user.department = str(payload['department']).strip()
    if 'active' in payload and current_user.role == 'librarian':
        user.active = bool(payload['active'])
    if 'role' in payload and current_user.role == 'librarian':
        if payload['role'] in ('student', 'librarian'):
            user.role = payload['role']

    db.session.commit()
    return _ok(_enrich_user(user))
