from flask import Blueprint, jsonify
from models import Status
from utils.auth import token_required  # Adjust the import path if needed

status_bp = Blueprint('status', __name__)

@status_bp.route('/api/status', methods=['GET'])
@token_required
def get_all_status(current_user):
    statuses = Status.query.all()
    return jsonify([s.to_dict() for s in statuses])