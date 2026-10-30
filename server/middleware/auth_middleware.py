from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models.user import User


def jwt_required_custom(fn):
    """Decorator: require a valid JWT and load the user object."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.active:
            return jsonify({'error': 'Your account is inactive or could not be found.', 'status': 401}), 401
        return fn(*args, current_user=user, **kwargs)
    return wrapper


def librarian_required(fn):
    """Decorator: require librarian role after JWT validation."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.active:
            return jsonify({'error': 'Your account is inactive or could not be found.', 'status': 401}), 401
        if user.role != 'librarian':
            return jsonify({'error': 'This action requires librarian permissions.', 'status': 403}), 403
        return fn(*args, current_user=user, **kwargs)
    return wrapper


def student_required(fn):
    """Decorator: require student role after JWT validation."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.active:
            return jsonify({'error': 'Your account is inactive or could not be found.', 'status': 401}), 401
        if user.role != 'student':
            return jsonify({'error': 'This endpoint is for student accounts only.', 'status': 403}), 403
        return fn(*args, current_user=user, **kwargs)
    return wrapper
