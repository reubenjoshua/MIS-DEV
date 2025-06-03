from flask import Blueprint, request, jsonify
from models import db, SourceName, BranchSourceName

source_name_bp = Blueprint('source_name', __name__)

@source_name_bp.route('/api/source-name', methods=['POST'])
def create_source_name():
    data = request.json
    new_source_name = SourceName(
        sourceName=data['sourceName'],
        sourceTypeId=data['sourceTypeId'],
        isActive=data.get('isActive', True)
    )
    db.session.add(new_source_name)
    db.session.commit()
    return jsonify(new_source_name.to_dict()), 201