from flask import Blueprint, request, jsonify
from middleware.auth_middleware import jwt_required_custom
from services import notification_service

notification_bp = Blueprint('notifications', __name__)


def _ok(data, status=200):
    return jsonify({'data': data}), status


@notification_bp.get('')
@jwt_required_custom
def get_notifications(current_user):
    return _ok(notification_service.get_notifications(current_user.id))


@notification_bp.patch('/read-all')
@jwt_required_custom
def mark_all_read(current_user):
    notification_service.mark_all_as_read(current_user.id)
    return _ok(True)


@notification_bp.patch('/<note_id>')
@jwt_required_custom
def mark_read(note_id, current_user):
    try:
        result = notification_service.mark_as_read(note_id, current_user.id)
        return _ok(result)
    except (ValueError, PermissionError) as e:
        return jsonify({'message': str(e)}), 403 if isinstance(e, PermissionError) else 404


@notification_bp.delete('/<note_id>')
@jwt_required_custom
def delete_notification(note_id, current_user):
    try:
        notification_service.delete_notification(note_id, current_user.id)
        return _ok(True)
    except (ValueError, PermissionError) as e:
        return jsonify({'message': str(e)}), 403 if isinstance(e, PermissionError) else 404
