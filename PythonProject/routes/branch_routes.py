from flask import Blueprint, request, jsonify
from models import db, Branch, BranchSource, BranchSourceName, SourceName
from utils.auth import token_required  # Adjust the import path if needed
import logging

# Configure logging
logger = logging.getLogger(__name__)

branch_bp = Blueprint('branch', __name__)


@branch_bp.route('/api/branches', methods=['GET'])
@token_required
def get_all_branches(current_user):
    try:
        # Debug logs - commented out
        # logger.debug("Fetching all branches...")
        branches = Branch.query.all()
        # logger.debug("Found %d branches", len(branches))
        # for branch in branches:
        #     logger.debug("Branch: %s, Active: %s", branch.branchName, branch.isActive)

        return jsonify([{
            'id': branch.id,
            'areaId': branch.areaId,
            'branchName': branch.branchName,
            'isActive': branch.isActive
        } for branch in branches])
    except Exception as e:
        logger.error("Error fetching branches: %s", str(e))
        return jsonify({'message': f'Failed to get branches: {str(e)}'}), 500


@branch_bp.route('/api/branches', methods=['POST'])
@token_required
def create_branch(current_user):
    data = request.get_json()
    new_branch = Branch(
        areaId=data['areaId'],
        branchName=data['branchName'],
        isActive=data.get('isActive', True)
    )
    db.session.add(new_branch)
    db.session.commit()
    return jsonify({
        'id': new_branch.id,
        'areaId': new_branch.areaId,
        'branchName': new_branch.branchName,
        'isActive': new_branch.isActive
    }), 201


@branch_bp.route('/api/branch', methods=['POST'])
def add_branch():
    data = request.json
    area_id = data['areaId']
    branch_name = data['branchName']
    source_type_ids = data['sourceTypeIds']  # List of selected sourceType IDs

    # Create the branch
    branch = Branch(areaId=area_id, branchName=branch_name, isActive=True)
    db.session.add(branch)
    db.session.commit()

    # Link branch to source types
    for st_id in source_type_ids:
        bs = BranchSource(branchId=branch.id, sourceTypeId=st_id)
        db.session.add(bs)
    db.session.commit()

    return jsonify({'branchId': branch.id}), 201


@branch_bp.route('/api/branch/<int:branch_id>/details', methods=['GET'])
def get_branch_details(branch_id):
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    # Get source types for this branch
    source_types = [
        {
            'id': bs.sourceTypeId,
            'name': bs.source_type.sourceType
        }
        for bs in branch.branch_sources
    ]

    # Get source names for this branch
    branch_source_names = BranchSourceName.query.filter_by(branchId=branch_id).all()
    source_names = [
        {
            'id': bsn.sourceNameId,
            'name': bsn.source_name.sourceName,
            'sourceTypeId': bsn.source_name.sourceTypeId
        }
        for bsn in branch_source_names
    ]

    return jsonify({
        'id': branch.id,
        'areaId': branch.areaId,
        'branchName': branch.branchName,
        'sourceTypes': source_types,
        'sourceNames': source_names
    })


@branch_bp.route('/api/branch/full-create', methods=['POST'])
def full_create_branch():
    data = request.json
    area_id = data['areaId']
    branch_name = data['branchName']
    source_types = data['sourceTypes']  # List of {id, sourceNames: [str, ...]}

    # Create the branch
    branch = Branch(areaId=area_id, branchName=branch_name, isActive=True)
    db.session.add(branch)
    db.session.commit()

    # For each source type, create BranchSource and SourceNames
    for st in source_types:
        st_id = st['id']
        bs = BranchSource(branchId=branch.id, sourceTypeId=st_id)
        db.session.add(bs)
        db.session.commit()
        for sn in st.get('sourceNames', []):
            # Create SourceName
            source_name = SourceName(branchId=branch.id, sourceTypeId=st_id, sourceName=sn, isActive=True)
            db.session.add(source_name)
            db.session.commit()
            # Link in BranchSourceName
            bsn = BranchSourceName(branchId=branch.id, sourceNameId=source_name.id)
            db.session.add(bsn)
            db.session.commit()

    return jsonify({'branchId': branch.id}), 201


@branch_bp.route('/api/branches/<int:branch_id>/toggle-active', methods=['PUT'])
@token_required
def toggle_branch_active(current_user, branch_id):
    try:
        branch = Branch.query.get(branch_id)
        if not branch:
            return jsonify({'message': 'Branch not found'}), 404

        # Toggle the isActive status
        branch.isActive = not branch.isActive
        db.session.commit()

        return jsonify({
            'id': branch.id,
            'areaId': branch.areaId,
            'branchName': branch.branchName,
            'isActive': branch.isActive
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update branch status: {str(e)}'}), 500

