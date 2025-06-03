from flask import Blueprint, jsonify, request
from models import db, Branch, BranchSourceName, SourceName, SourceType

branch_source_name_bp = Blueprint('branch_source_name', __name__)

@branch_source_name_bp.route('/api/branch/<int:branch_id>/source-names', methods=['GET'])
def get_branch_source_names(branch_id):
    source_type_id = request.args.get('sourceTypeId', type=int)

    query = (
        db.session.query(SourceName, SourceType)
        .join(BranchSourceName, BranchSourceName.sourceNameId == SourceName.id)
        .join(SourceType, SourceName.sourceTypeId == SourceType.id)
        .filter(BranchSourceName.branchId == branch_id)
    )
    if source_type_id:
        query = query.filter(SourceName.sourceTypeId == source_type_id)

    results = query.all()
    #print(f"Results for branch {branch_id}: {results}")  # Debug print
    response = [
        {
            **sn.to_dict(),
            "sourceTypeName": st.sourceType
        }
        for sn, st in results
    ]
    #print(f"Response: {response}")  # Debug print
    return jsonify(response)

@branch_source_name_bp.route('/api/branch-source-name', methods=['POST'])
def create_branch_source_name():
    data = request.json
    branch_id = data['branchId']
    source_name_id = data['sourceNameId']
    is_active = data.get('isActive', True)

    # Verify branch exists
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    new_bsn = BranchSourceName(
        branchId=branch_id,
        sourceNameId=source_name_id,
        isActive=is_active
    )
    db.session.add(new_bsn)
    db.session.commit()
    return jsonify(new_bsn.to_dict()), 201


