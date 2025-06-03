from flask import Blueprint, request, jsonify
from models import db, SourceType, SourceName
from utils.auth import token_required  # Adjust the import path if needed

source_bp = Blueprint('source', __name__)

@source_bp.route('/api/source-types', methods=['GET'])
@token_required
def get_all_source_types(current_user):
    items = SourceType.query.all()
    return jsonify([item.to_dict() for item in items])

@source_bp.route('/api/source-names', methods=['GET'])
@token_required
def get_all_source_names(current_user):
    items = SourceName.query.all()
    return jsonify([item.to_dict() for item in items])

@source_bp.route('/api/source-names', methods=['POST'])
@token_required
def create_source_name(current_user):
    data = request.get_json()
    new_source_name = SourceName(
        branchId=data['branchId'],
        sourceTypeId=data['sourceTypeId'],
        sourceName=data['sourceName'],
        isActive=data.get('isActive', True)
    )
    db.session.add(new_source_name)
    db.session.commit()
    return jsonify(new_source_name.to_dict()), 201