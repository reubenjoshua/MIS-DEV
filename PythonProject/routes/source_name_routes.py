from flask import Blueprint, request, jsonify
from models import db, SourceName, BranchSourceName

source_name_bp = Blueprint('source_name', __name__)

@source_name_bp.route('/api/source-name', methods=['POST'])
def create_source_name():
    data = request.json

    # 1. Check if SourceName exists (ignoring branchId)
    existing_source = SourceName.query.filter_by(
        sourceName=data['sourceName'],
        sourceTypeId=data['sourceTypeId']
    ).first()

    if existing_source:
        source_name = existing_source
    else:
        # 2. Create new SourceName if not found (do NOT include branchId)
        source_name = SourceName(
            sourceName=data['sourceName'],
            sourceTypeId=data['sourceTypeId'],
            isActive=data.get('isActive', True)
        )
        db.session.add(source_name)
        db.session.commit()

    # 3. Create the link in BranchSourceName (always create this)
    new_bsn = BranchSourceName(
        branchId=data['branchId'],
        sourceNameId=source_name.id,
        isActive=True
    )
    db.session.add(new_bsn)
    db.session.commit()

    return jsonify(source_name.to_dict()), 201

# New endpoint to get all source names/types for a branch
@source_name_bp.route('/api/branch/<int:branch_id>/source-names', methods=['GET'])
def get_source_names_for_branch(branch_id):
    # Join BranchSourceName and SourceName to get all source names/types for this branch
    results = db.session.query(SourceName, BranchSourceName).\
        join(BranchSourceName, SourceName.id == BranchSourceName.sourceNameId).\
        filter(BranchSourceName.branchId == branch_id).all()
    
    # Format the results
    output = []
    for source_name, branch_source_name in results:
        output.append({
            'id': source_name.id,
            'sourceName': source_name.sourceName,
            'sourceTypeId': source_name.sourceTypeId,
            'isActive': source_name.isActive,
            # Add more fields as needed
        })
    return jsonify(output) 