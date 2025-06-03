from flask import Blueprint, jsonify, current_app
from models import Area
from utils.auth import token_required  # Adjust the import path if needed

area_bp = Blueprint('area', __name__)

@area_bp.route('/api/areas', methods=['GET'])
@token_required
def get_all_areas(current_user):
    try:
        areas = Area.query.filter_by(isActive=True).all()
        area_list = [{
            'id': area.id,
            'areaCode': area.areaCode,
            'areaName': area.areaName,
            'isActive': area.isActive
        } for area in areas]
        return jsonify(area_list)
    except Exception as e:
        return jsonify({'message': f'Failed to get areas: {str(e)}'}), 500

@area_bp.route('/api/test-areas', methods=['GET'])
def test_areas():
    try:
        area = Area.query.first()
        if area:
            return jsonify({
                'status': 'success',
                'message': 'Successfully found an area',
                'area': {
                    'id': area.id,
                    'areaCode': area.areaCode,
                    'areaName': area.areaName,
                    'isActive': area.isActive
                }
            })
        else:
            return jsonify({
                'status': 'success',
                'message': 'No areas found in database',
                'area': None
            })
    except Exception as e:
        current_app.logger.error(f"Error in test_areas: {str(e)}")
        import traceback
        current_app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'message': f'Error testing areas: {str(e)}'
        }), 500