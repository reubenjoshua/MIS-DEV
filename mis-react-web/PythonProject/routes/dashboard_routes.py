from flask import Blueprint, jsonify
from models import User, Area, Branch
from utils.auth import token_required  # Adjust the import path if needed

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard-stats', methods=['GET'])
@token_required
def dashboard_stats(current_user):
    active_users = User.query.filter_by(isActive=True).count()
    areas = Area.query.filter_by(isActive=True).count()
    branches = Branch.query.filter_by(isActive=True).count()
    approved = 0  # Replace with your own logic if needed

    return jsonify({
        "ActiveUsers": active_users,
        "Areas": areas,
        "Branches": branches,
        "Approved": approved,
    })