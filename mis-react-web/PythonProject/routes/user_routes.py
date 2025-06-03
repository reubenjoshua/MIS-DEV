from flask import Blueprint, jsonify, request
from models import User, db  # Import db from models instead of creating a new instance
from utils.auth import token_required  # Adjust the import path if needed

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        return jsonify(current_user.to_dict())
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500

@user_bp.route('/api/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        return jsonify({'message': f'Failed to get users: {str(e)}'}), 500

@user_bp.route('/api/users/<int:user_id>/toggle-active', methods=['PUT'])
@token_required
def toggle_user_active(current_user, user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Toggle the isActive status
        user.isActive = not user.isActive
        db.session.commit()

        return jsonify(user.to_dict()), 200  # Use the to_dict method for consistent response format
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update user status: {str(e)}'}), 500