from flask import Blueprint, request, jsonify
from middleware.auth_middleware import librarian_required
from services import inventory_service

inventory_bp = Blueprint('inventory', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


@inventory_bp.get('')
@librarian_required
def get_inventory(current_user):
    return _ok(inventory_service.get_inventory())


@inventory_bp.get('/misplaced')
@librarian_required
def get_misplaced(current_user):
    return _ok(inventory_service.get_misplaced_books())


@inventory_bp.patch('/misplaced/<alert_id>')
@librarian_required
def update_alert(alert_id, current_user):
    payload = request.get_json(silent=True) or {}
    status = str(payload.get('status', '')).strip()
    try:
        result = inventory_service.update_alert_status(alert_id, status, actor_name=current_user.name)
        return _ok(result)
    except ValueError as e:
        return jsonify({'message': str(e)}), 409


@inventory_bp.post('/misplaced/<alert_id>/verify')
@librarian_required
def verify_alert(alert_id, current_user):
    payload = request.get_json(silent=True) or {}
    verified_location_id = str(payload.get('verifiedLocationId', '')).strip()
    if not verified_location_id:
        return jsonify({'message': 'verifiedLocationId is required.'}), 422
    try:
        result = inventory_service.verify_alert(alert_id, verified_location_id, actor_name=current_user.name)
        return _ok(result)
    except ValueError as e:
        return jsonify({'message': str(e)}), 409


@inventory_bp.post('/audit')
@librarian_required
def run_audit(current_user):
    result = inventory_service.run_audit(actor_name=current_user.name)
    return _ok(result, 201)


@inventory_bp.get('/audit')
@librarian_required
def audit_history(current_user):
    return _ok(inventory_service.get_audit_history())
