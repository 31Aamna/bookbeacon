from flask import Blueprint, request, jsonify
from models.scan_log import ScanLog
from middleware.auth_middleware import jwt_required_custom, librarian_required
from services import qr_service

scan_bp = Blueprint('scans', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


@scan_bp.get('')
@librarian_required
def get_scan_logs(current_user):
    logs = ScanLog.query.order_by(ScanLog.scanned_at.desc()).all()
    return _ok([log.to_dict() for log in logs])


@scan_bp.get('/lookup')
@jwt_required_custom
def lookup(current_user):
    """GET /api/scans/lookup?identifier=BB-2048  — matches qrService.lookupCopy"""
    identifier = request.args.get('identifier', '').strip()
    if not identifier:
        return jsonify({'message': 'identifier query parameter is required.'}), 422
    copy = qr_service.lookup_copy(identifier)
    if not copy:
        return _ok(None)
    return _ok(copy.to_dict())


@scan_bp.post('/verify')
@jwt_required_custom
def verify_scan(current_user):
    """POST /api/scans/verify  — matches qrService.verifyScan"""
    payload = request.get_json(silent=True) or {}
    identifier = str(payload.get('identifier', '')).strip()
    observed_location_id = payload.get('observedLocationId') or None
    scan_type = str(payload.get('scanType', 'QR_SCAN')).strip()

    if not identifier:
        return jsonify({'message': 'identifier is required.'}), 422

    result = qr_service.verify_scan(
        identifier=identifier,
        observed_location_id=observed_location_id,
        scan_type=scan_type,
    )
    return _ok(result)
