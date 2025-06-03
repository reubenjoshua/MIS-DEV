from flask import Blueprint, jsonify, request
from models import Daily, User, Branch, Area, Status, db
from utils.auth import token_required  # Adjust the import path if needed
import logging

# Configure logging
logger = logging.getLogger(__name__)

daily_bp = Blueprint('daily', __name__)


@daily_bp.route('/api/daily', methods=['GET'])
@token_required
def get_all_daily(current_user):
    # Get user's role and branch
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Base query
    query = Daily.query

    # Filter based on role and branch
    if user.roleId == 3:  # Branch Admin
        # Branch admin can only see their assigned branch's data
        query = query.filter(Daily.branchId == user.branchId)
    elif user.roleId == 4:  # Encoder
        # Encoder can only see their assigned branch's data
        query = query.filter(Daily.branchId == user.branchId)
    # Super Admin (1) and Central Admin (2) can see all data, no filtering needed

    # Join with Branch and Area
    query = query.join(Branch, Daily.branchId == Branch.id).join(Area, Branch.areaId == Area.id).add_entity(
        Branch).add_entity(Area)

    daily_reports = query.all()
    result = []
    for report, branch, area in daily_reports:
        # Get the status name from the Status table
        status_obj = Status.query.get(report.status) if report.status else None
        status_name = status_obj.statusName if status_obj else "Pending"
        result.append({
            'id': report.id,
            'monthlyId': report.monthlyId,
            'sourceType': report.sourceType,
            'sourceName': report.sourceName,
            'status': report.status,
            'statusName': status_name,
            'byUser': report.byUser,
            'date': report.date,
            'productionVolume': report.productionVolume,
            'operationHours': report.operationHours,
            'serviceInterruption': report.serviceInterruption,
            'totalHoursServiceInterruption': report.totalHoursServiceInterruption,
            'electricityConsumption': report.electricityConsumption,
            'VFDFrequency': report.VFDFrequency,
            'spotFlow': report.spotFlow,
            'spotPressure': report.spotPressure,
            'timeSpotMeasurements': report.timeSpotMeasurements,
            'lineVoltage1': report.lineVoltage1,
            'lineVoltage2': report.lineVoltage2,
            'lineVoltage3': report.lineVoltage3,
            'lineCurrent1': report.lineCurrent1,
            'lineCurrent2': report.lineCurrent2,
            'lineCurrent3': report.lineCurrent3,
            'comment': report.comment,
            'isActive': report.isActive,
            'branchId': report.branchId,
            'branchName': branch.branchName if branch else '',
            'areaName': area.areaName if area else ''
        })
    return jsonify(result)


@daily_bp.route('/api/daily', methods=['POST'])
@token_required
def create_daily(current_user):
    try:
        # Get user's role and branch
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        data = request.get_json()
        # Debug logs - commented out
        # logger.debug("User role: %s, User branch: %s", user.roleId, user.branchId)
        # logger.debug("Request branchId: %s", data.get('branchId'))

        # Validate branch permissions
        if user.roleId in [3, 4]:  # Branch Admin or Encoder
            if str(data.get('branchId')) != str(user.branchId):
                # logger.debug("Branch validation failed: %s != %s", str(data.get('branchId')), str(user.branchId))
                return jsonify({'message': 'You can only submit data for your assigned branch'}), 403

        # Create new daily record
        new_daily = Daily(
            monthlyId=data.get('monthlyId'),
            sourceType=data.get('sourceType'),
            sourceName=data.get('sourceName'),
            byUser=current_user.id,
            date=data.get('date'),
            productionVolume=data.get('productionVolume'),
            operationHours=data.get('operationHours'),
            serviceInterruption=data.get('serviceInterruption'),
            totalHoursServiceInterruption=data.get('totalHoursServiceInterruption'),
            electricityConsumption=data.get('electricityConsumption'),
            VFDFrequency=data.get('VFDFrequency'),
            spotFlow=data.get('spotFlow'),
            spotPressure=data.get('spotPressure'),
            timeSpotMeasurements=data.get('timeSpotMeasurements'),
            lineVoltage1=data.get('lineVoltage1'),
            lineVoltage2=data.get('lineVoltage2'),
            lineVoltage3=data.get('lineVoltage3'),
            lineCurrent1=data.get('lineCurrent1'),
            lineCurrent2=data.get('lineCurrent2'),
            lineCurrent3=data.get('lineCurrent3'),
            comment=data.get('comment'),
            isActive=data.get('isActive', True),
            branchId=data.get('branchId'),
            areaId=data.get('areaId')
        )

        db.session.add(new_daily)
        db.session.commit()

        return jsonify({
            'message': 'Daily record created successfully',
            'id': new_daily.id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Debug - Error creating daily record: {str(e)}")
        return jsonify({'message': f'Failed to create daily record: {str(e)}'}), 500