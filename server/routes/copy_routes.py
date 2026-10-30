from flask import Blueprint, request, jsonify
from extensions import db
from models.book_copy import BookCopy
from models.book import Book
from models.location import Shelf
from models.borrowing import BorrowingTransaction
from services.borrowing_service import make_next_id
from middleware.auth_middleware import librarian_required

copy_bp = Blueprint('copies', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


@copy_bp.get('')
def list_copies():
    book_id = request.args.get('bookId', '').strip()
    query = BookCopy.query
    if book_id:
        query = query.filter_by(book_id=book_id)
    copies = query.all()
    return _ok([c.to_dict() for c in copies])


@copy_bp.get('/<copy_id>')
def get_copy(copy_id):
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'message': 'That physical copy could not be found.'}), 404
    return _ok(copy.to_dict())


@copy_bp.post('')
@librarian_required
def create_copy(current_user):
    payload = request.get_json(silent=True) or {}
    copy_id = str(payload.get('id', '')).strip().upper()
    book_id = str(payload.get('bookId', '')).strip()
    location_id = str(payload.get('locationId', '')).strip()
    status = payload.get('status', 'AVAILABLE')

    if not copy_id:
        return jsonify({'message': 'Enter a unique Book ID for this physical copy.'}), 422
    if BookCopy.query.filter(
        db.or_(
            db.func.upper(BookCopy.id) == copy_id,
            db.func.upper(BookCopy.qr_code) == copy_id,
        )
    ).first():
        return jsonify({'message': 'That Book ID or QR identifier already exists. Choose another identifier.'}), 409

    book = Book.query.get(book_id)
    if not book or book.archived_at:
        return jsonify({'message': 'Select a valid active catalogue title.'}), 422

    shelf = Shelf.query.get(location_id)
    if not shelf:
        return jsonify({'message': 'Select a registered shelf location.'}), 422

    allowed_status = 'MAINTENANCE' if status == 'MAINTENANCE' else 'AVAILABLE'
    copy = BookCopy(
        id=copy_id,
        book_id=book_id,
        qr_code=copy_id,
        status=allowed_status,
        shelf_id=location_id,
    )
    db.session.add(copy)
    db.session.commit()
    return _ok(copy.to_dict(), 201)


@copy_bp.patch('/<copy_id>')
@librarian_required
def update_copy(copy_id, current_user):
    copy = BookCopy.query.get(copy_id)
    if not copy:
        return jsonify({'message': 'That physical copy could not be found.'}), 404
    if copy.status == 'RETIRED':
        return jsonify({'message': 'This copy is retained only for historical records and cannot be edited.'}), 409

    payload = request.get_json(silent=True) or {}

    if 'locationId' in payload:
        shelf = Shelf.query.get(payload['locationId'])
        if not shelf:
            return jsonify({'message': 'Select a registered shelf location.'}), 422
        copy.shelf_id = payload['locationId']

    if 'status' in payload:
        new_status = payload['status']
        has_active_loan = BorrowingTransaction.query.filter_by(copy_id=copy_id, status='ISSUED').first()
        if has_active_loan and new_status != 'ISSUED':
            return jsonify({'message': "An issued copy's status can only be changed by recording its return."}), 409
        if not has_active_loan and new_status == 'ISSUED':
            return jsonify({'message': 'Use the circulation workflow to issue a copy.'}), 409
        if new_status not in ('AVAILABLE', 'ISSUED', 'MAINTENANCE'):
            return jsonify({'message': 'Choose an allowed copy status.'}), 422
        copy.status = new_status

    db.session.commit()
    return _ok(copy.to_dict())
