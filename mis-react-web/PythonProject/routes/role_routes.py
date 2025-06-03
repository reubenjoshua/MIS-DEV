from flask import Blueprint, jsonify
from models import Role
from utils.auth import token_required  # Adjust the import path if needed

role_bp = Blueprint('role', __name__)

@role_bp.route('/api/roles', methods=['GET'])
@token_required
def get_all_roles(current_user):
    try:
        roles = Role.query.all()
        return jsonify([{
            'id': role.id,
            'roleName': role.roleName,
            'description': role.description
        } for role in roles])
    except Exception as e:
        return jsonify({'message': f'Failed to get roles: {str(e)}'}), 500