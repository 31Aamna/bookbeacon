from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from extensions import db
from models.user import User
from services.borrowing_service import make_next_id
from middleware.auth_middleware import jwt_required_custom

auth_bp = Blueprint('auth', __name__)


def _user_response(user: User, token: str = None):
    data = {'user': user.to_dict()}
    if token:
        data['access_token'] = token
        data['token'] = token  # alias for apiClient.js compatibility
    return jsonify({'data': data}), 200


@auth_bp.post('/register')
def register():
    payload = request.get_json(silent=True) or {}
    errors = {}
    full_name = str(payload.get('fullName', '')).strip()
    email = str(payload.get('email', '')).strip().lower()
    identifier = str(payload.get('identifier', '')).strip()
    department = str(payload.get('department', '')).strip()
    password = str(payload.get('password', ''))
    confirm = str(payload.get('confirmPassword', ''))

    if not full_name:
        errors['fullName'] = 'Enter your full name.'
    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        errors['email'] = 'Enter a valid email address.'
    if not identifier:
        errors['identifier'] = 'Enter your student or staff ID.'
    if not department:
        errors['department'] = 'Enter your department.'
    if len(password) < 8:
        errors['password'] = 'Use at least 8 characters.'
    if password != confirm:
        errors['confirmPassword'] = 'Passwords do not match.'
    if errors:
        return jsonify({'message': 'Please correct the highlighted registration fields.', 'fieldErrors': errors}), 422

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'An account already uses this email address. Try signing in instead.'}), 409
    if User.query.filter_by(identifier=identifier).first():
        return jsonify({'message': 'An account already uses this student or staff ID.'}), 409

    user = User(
        id=make_next_id(User, 'USER'),
        name=full_name,
        email=email,
        identifier=identifier,
        department=department,
        role='student',  # Public registration always creates students
        active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return _user_response(user, token)


@auth_bp.post('/login')
def login():
    payload = request.get_json(silent=True) or {}
    identifier = str(payload.get('identifier', '')).strip().lower()
    password = str(payload.get('password', ''))

    if not identifier or not password:
        return jsonify({'message': 'Enter your email or ID and password.'}), 422

    user = User.query.filter(
        db.or_(
            db.func.lower(User.email) == identifier,
            db.func.lower(User.identifier) == identifier,
        )
    ).first()

    if not user or not user.active or not user.check_password(password):
        return jsonify({'message': 'Those details do not match an active account. Check your credentials and try again.'}), 401

    token = create_access_token(identity=user.id)
    return _user_response(user, token)


@auth_bp.post('/logout')
def logout():
    # JWT tokens are stateless; client removes the token
    return jsonify({'data': {'message': 'Logged out successfully.'}}), 200


@auth_bp.get('/me')
@jwt_required_custom
def me(current_user):
    return jsonify({'data': {'user': current_user.to_dict()}}), 200
