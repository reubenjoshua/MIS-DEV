from flask import Blueprint, jsonify, request
from models import Monthly, User, db, Daily, SourceType, SourceName
from utils.auth import token_required  # Adjust the import path if needed
from sqlalchemy import func
from datetime import datetime
import sys
import logging
import os

# Get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(current_dir, 'monthly_routes.log')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),  # Use stderr instead of stdout
        logging.FileHandler(log_file, mode='a')  # Use absolute path and append mode
    ]
)
logger = logging.getLogger(__name__)

# Force immediate flush of logs
for handler in logger.handlers:
    handler.flush = lambda: True

logger.info("=" * 50)
logger.info("Monthly routes module loaded")
logger.info("Log file location: %s", log_file)
logger.info("=" * 50)

monthly_bp = Blueprint('monthly', __name__)


def sum_daily_fields(branch_id, source_type_id, year, month):
    """
    Calculate sums of daily fields for the given branch, source type, year, and month.
    Returns a dictionary of summed values or None if no daily records found.
    """
    try:
        # Validate inputs
        if not year or not month:
            print("Error in sum_daily_fields: year or month is empty")
            return None

        # Convert month and year to integers
        try:
            month = int(month)
            year = int(year)
        except (ValueError, TypeError) as e:
            print(f"Error in sum_daily_fields: Invalid month/year values - {str(e)}")
            return None

        # Validate month range
        if not (1 <= month <= 12):
            print(f"Error in sum_daily_fields: Invalid month value - {month}")
            return None

        # Get the first and last day of the month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        # Query daily records for the given period
        daily_records = Daily.query.filter(
            Daily.branchId == branch_id,
            Daily.sourceType == source_type_id,
            Daily.date >= start_date,
            Daily.date < end_date,
            Daily.isActive == True
        ).all()

        if not daily_records:
            return None

        # Calculate sums
        sums = {
            'productionVolume': sum(r.productionVolume or 0 for r in daily_records),
            'operationHours': sum(r.operationHours or 0 for r in daily_records),
            'serviceInterruption': sum(r.serviceInterruption or 0 for r in daily_records),
            'totalHoursServiceInterruption': sum(r.totalHoursServiceInterruption or 0 for r in daily_records),
            'electricityConsumption': sum(r.electricityConsumption or 0 for r in daily_records)
        }

        return sums
    except Exception as e:
        print(f"Error in sum_daily_fields: {str(e)}")
        return None


@monthly_bp.route('/api/monthly', methods=['GET'])
@token_required
def get_all_monthly(current_user):
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    query = Monthly.query

    if user.roleId == 3:  # Branch Admin
        query = query.filter(Monthly.branchId == user.branchId)
    elif user.roleId == 4:  # Encoder
        query = query.filter(Monthly.branchId == user.branchId)

    items = query.all()

    def monthly_to_dict(m):
        return {
            'id': m.id,
            'branchId': m.branchId,
            'sourceType': m.sourceType,
            'sourceName': m.sourceName,
            'status': m.status,
            'byUser': m.byUser,
            'month': m.month,
            'year': m.year,
            'electricityConsumption': m.electricityConsumption,
            'electricityCost': m.electricityCost,
            'bulkCost': m.bulkCost,
            'bulkOuttake': m.bulkOuttake,
            'bulkProvider': m.bulkProvider,
            'WTPCost': m.WTPCost,
            'WTPSource': m.WTPSource,
            'WTPVolume': m.WTPVolume,
            'disinfectionMode': m.disinfectionMode,
            'disinfectantCost': m.disinfectantCost,
            'disinfectionAmount': m.disinfectionAmount,
            'disinfectionBrandType': m.disinfectionBrandType,
            'otherTreatmentCost': m.otherTreatmentCost,
            'emergencyLitersConsumed': m.emergencyLitersConsumed,
            'emergencyFuelCost': m.emergencyFuelCost,
            'emergencyTotalHoursUsed': m.emergencyTotalHoursUsed,
            'gensetLitersConsumed': m.gensetLitersConsumed,
            'gensetFuelCost': m.gensetFuelCost,
            'isActive': m.isActive,
            'comment': m.comment
        }

    return jsonify([monthly_to_dict(m) for m in items])


def convert_to_float(value):
    """Helper function to safely convert values to float, always returns a number (never None)"""
    try:
        logger.debug(f"convert_to_float called with value: {value} (type: {type(value)})")
        # If value is already a number, return it
        if isinstance(value, (int, float)):
            logger.debug(f"Value is already a number: {value}")
            return float(value)
        # If value is None or empty string, return 0
        if value is None or value == '':
            logger.debug("Converting empty value to 0")
            return 0
        # Try to convert string to float
        result = float(value)
        logger.debug(f"Successfully converted {value} to {result}")
        return result
    except (ValueError, TypeError) as e:
        logger.error(f"Error converting {value} to float: {str(e)}")
        return 0


@monthly_bp.route('/api/monthly', methods=['POST'])
@token_required
def create_monthly(current_user):
    # Force immediate logging
    sys.stderr.write("\n=== CREATE_MONTHLY ROUTE HIT ===\n")
    sys.stderr.flush()

    logger.info("=" * 50)
    logger.info("CREATE_MONTHLY ROUTE HIT - REQUEST RECEIVED")
    logger.info("=" * 50)

    try:
        # Log the raw request data first
        request_data = request.get_data()
        request_headers = dict(request.headers)
        logger.info("Request received at: %s", datetime.now().isoformat())
        logger.info("Raw request data: %s", request_data)
        logger.info("Request headers: %s", request_headers)

        user = User.query.get(current_user.id)
        if not user:
            logger.error("User not found! User ID: %s", current_user.id)
            return jsonify({'message': 'User not found'}), 404

        data = request.get_json()
        if data is None:
            logger.error("No JSON data received in request!")
            return jsonify({'message': 'No data received'}), 400

        logger.info("Received data in backend:")
        for key, value in data.items():
            logger.info("%s: %s (type: %s)", key, value, type(value))

        # Log the specific fields we're interested in
        logger.info("Preview sums values:")
        logger.info("productionVolume: %s", data.get('productionVolume'))
        logger.info("operationHours: %s", data.get('operationHours'))
        logger.info("serviceInterruption: %s", data.get('serviceInterruption'))
        logger.info("totalHoursServiceInterruption: %s", data.get('totalHoursServiceInterruption'))

        if user.roleId in [3, 4]:  # Branch Admin or Encoder
            if str(data.get('branchId')) != str(user.branchId):
                logger.warning("Permission denied: User %s tried to access branch %s", user.id, data.get('branchId'))
                return jsonify({'message': 'You can only submit data for your assigned branch'}), 403

        numeric_fields = {
            'electricityConsumption': convert_to_float,
            'electricityCost': convert_to_float,
            'bulkCost': convert_to_float,
            'bulkOuttake': convert_to_float,
            'WTPCost': convert_to_float,
            'WTPVolume': convert_to_float,
            'disinfectantCost': convert_to_float,
            'disinfectionAmount': convert_to_float,
            'otherTreatmentCost': convert_to_float,
            'emergencyLitersConsumed': convert_to_float,
            'emergencyFuelCost': convert_to_float,
            'emergencyTotalHoursUsed': convert_to_float,
            'gensetLitersConsumed': convert_to_float,
            'gensetFuelCost': convert_to_float,
            'productionVolume': convert_to_float,
            'operationHours': convert_to_float,
            'serviceInterruption': convert_to_float,
            'totalHoursServiceInterruption': convert_to_float
        }

        logger.info("Converting numeric fields:")
        for field, converter in numeric_fields.items():
            if field in data:
                original_value = data[field]
                data[field] = converter(data[field])
                logger.info("%s: %s -> %s", field, original_value, data[field])

        # Ensure all numeric fields are present in data, defaulting to 0
        for field in numeric_fields:
            if field not in data:
                logger.info("Adding missing field %s with default value 0", field)
                data[field] = 0

        logger.info("Final data to be saved:")
        for key, value in data.items():
            logger.info("%s: %s (type: %s)", key, value, type(value))

        new_monthly = Monthly(
            branchId=data.get('branchId'),
            sourceType=data.get('sourceType'),
            sourceName=data.get('sourceName'),
            byUser=current_user.id,
            month=data.get('month'),
            year=data.get('year'),
            productionVolume=data.get('productionVolume'),
            operationHours=data.get('operationHours'),
            serviceInterruption=data.get('serviceInterruption'),
            totalHoursServiceInterruption=data.get('totalHoursServiceInterruption'),
            electricityConsumption=data.get('electricityConsumption'),
            electricityCost=data.get('electricityCost'),
            bulkCost=data.get('bulkCost'),
            bulkOuttake=data.get('bulkOuttake'),
            bulkProvider=data.get('bulkProvider'),
            WTPCost=data.get('WTPCost'),
            WTPSource=data.get('WTPSource'),
            WTPVolume=data.get('WTPVolume'),
            disinfectionMode=data.get('disinfectionMode'),
            disinfectantCost=data.get('disinfectantCost'),
            disinfectionAmount=data.get('disinfectionAmount'),
            disinfectionBrandType=data.get('disinfectionBrandType'),
            otherTreatmentCost=data.get('otherTreatmentCost'),
            emergencyLitersConsumed=data.get('emergencyLitersConsumed'),
            emergencyFuelCost=data.get('emergencyFuelCost'),
            emergencyTotalHoursUsed=data.get('emergencyTotalHoursUsed'),
            gensetLitersConsumed=data.get('gensetLitersConsumed'),
            gensetFuelCost=data.get('gensetFuelCost'),
            isActive=data.get('isActive', True),
            comment=data.get('comment')
        )

        logger.info("Created Monthly object with values:")
        logger.info("productionVolume: %s", new_monthly.productionVolume)
        logger.info("operationHours: %s", new_monthly.operationHours)
        logger.info("serviceInterruption: %s", new_monthly.serviceInterruption)
        logger.info("totalHoursServiceInterruption: %s", new_monthly.totalHoursServiceInterruption)

        db.session.add(new_monthly)
        db.session.commit()
        logger.info("Successfully saved to database")

        return jsonify({
            'message': 'Monthly record created successfully',
            'id': new_monthly.id
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error("Error in create_monthly: %s", str(e), exc_info=True)
        return jsonify({'message': f'Failed to create monthly record: {str(e)}'}), 500


@monthly_bp.route('/api/monthly-data', methods=['GET'])
@token_required
def get_filtered_monthly(current_user):
    try:
        source_type_id = request.args.get('sourceTypeId')
        branch_id = request.args.get('branchId')

        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Start with all records
        query = Monthly.query.filter(Monthly.isActive == True)

        # Apply filters if provided
        if source_type_id:
            query = query.filter(Monthly.sourceType == source_type_id)
        if branch_id:
            query = query.filter(Monthly.branchId == branch_id)

        # Role-based filtering
        if user.roleId in [3, 4]:  # Branch Admin or Encoder
            query = query.filter(Monthly.branchId == user.branchId)

        items = query.all()

        def monthly_to_dict(m):
            source_type = SourceType.query.get(m.sourceType)
            source_name = SourceName.query.get(m.sourceName)
            return {
                'id': m.id,
                'branchId': m.branchId,
                'sourceType': m.sourceType,
                'sourceTypeName': source_type.sourceType if source_type else None,
                'sourceName': m.sourceName,
                'sourceNameName': source_name.sourceName if source_name else None,
                'status': m.status,
                'byUser': m.byUser,
                'month': m.month,
                'year': m.year,
                'productionVolume': m.productionVolume,
                'operationHours': m.operationHours,
                'serviceInterruption': m.serviceInterruption,
                'totalHoursServiceInterruption': m.totalHoursServiceInterruption,
                'electricityConsumption': m.electricityConsumption,
                'electricityCost': m.electricityCost,
                'bulkCost': m.bulkCost,
                'bulkOuttake': m.bulkOuttake,
                'bulkProvider': m.bulkProvider,
                'WTPCost': m.WTPCost,
                'WTPSource': m.WTPSource,
                'WTPVolume': m.WTPVolume,
                'disinfectionMode': m.disinfectionMode,
                'disinfectantCost': m.disinfectantCost,
                'disinfectionAmount': m.disinfectionAmount,
                'disinfectionBrandType': m.disinfectionBrandType,
                'otherTreatmentCost': m.otherTreatmentCost,
                'emergencyLitersConsumed': m.emergencyLitersConsumed,
                'emergencyFuelCost': m.emergencyFuelCost,
                'emergencyTotalHoursUsed': m.emergencyTotalHoursUsed,
                'gensetLitersConsumed': m.gensetLitersConsumed,
                'gensetFuelCost': m.gensetFuelCost,
                'isActive': m.isActive,
                'comment': m.comment
            }

        return jsonify([monthly_to_dict(m) for m in items])

    except Exception as e:
        print(f"Error in get_filtered_monthly: {str(e)}")
        return jsonify({'message': f'Failed to fetch monthly data: {str(e)}'}), 500


@monthly_bp.route('/api/daily-sums', methods=['GET'])
@token_required
def get_daily_sums(current_user):
    try:
        branch_id = request.args.get('branchId')
        source_type_id = request.args.get('sourceTypeId')
        month = request.args.get('month')
        year = request.args.get('year')

        if not all([branch_id, source_type_id, month, year]):
            return jsonify({'message': 'Missing required parameters'}), 400

        # Get user's role and branch
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Validate branch permissions
        if user.roleId in [3, 4]:  # Branch Admin or Encoder
            if str(branch_id) != str(user.branchId):
                return jsonify({'message': 'You can only view data for your assigned branch'}), 403

        # Get the sums using the existing function
        sums = sum_daily_fields(branch_id, source_type_id, year, month)

        if sums is None:
            return jsonify({
                'productionVolume': 0,
                'operationHours': 0,
                'serviceInterruption': 0,
                'totalHoursServiceInterruption': 0,
                'electricityConsumption': 0
            })

        return jsonify(sums)

    except Exception as e:
        print(f"Error in get_daily_sums: {str(e)}")
        return jsonify({'message': f'Failed to fetch daily sums: {str(e)}'}), 500


@monthly_bp.route('/api/daily-sums/batch', methods=['POST'])
@token_required
def get_daily_sums_batch(current_user):
    try:
        data = request.get_json()
        requests = data.get('requests', [])
        if not isinstance(requests, list):
            return jsonify({'message': 'Invalid request format'}), 400

        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        results = []
        for req in requests:
            branch_id = req.get('branchId')
            source_type_id = req.get('sourceTypeId')
            month = req.get('month')
            year = req.get('year')

            # Validate required fields
            if not all([branch_id, source_type_id, month, year]):
                results.append({
                    'branchId': branch_id,
                    'sourceTypeId': source_type_id,
                    'month': month,
                    'year': year,
                    'error': 'Missing required parameters',
                    'productionVolume': 0,
                    'operationHours': 0,
                    'serviceInterruption': 0,
                    'totalHoursServiceInterruption': 0,
                    'electricityConsumption': 0
                })
                continue

            # Validate branch permissions
            if user.roleId in [3, 4]:  # Branch Admin or Encoder
                if str(branch_id) != str(user.branchId):
                    results.append({
                        'branchId': branch_id,
                        'sourceTypeId': source_type_id,
                        'month': month,
                        'year': year,
                        'error': 'You can only view data for your assigned branch',
                        'productionVolume': 0,
                        'operationHours': 0,
                        'serviceInterruption': 0,
                        'totalHoursServiceInterruption': 0,
                        'electricityConsumption': 0
                    })
                    continue

            sums = sum_daily_fields(branch_id, source_type_id, year, month)
            if sums is None:
                sums = {
                    'productionVolume': 0,
                    'operationHours': 0,
                    'serviceInterruption': 0,
                    'totalHoursServiceInterruption': 0,
                    'electricityConsumption': 0
                }
            results.append({
                'branchId': branch_id,
                'sourceTypeId': source_type_id,
                'month': month,
                'year': year,
                **sums
            })
        return jsonify({'results': results})
    except Exception as e:
        print(f"Error in get_daily_sums_batch: {str(e)}")
        return jsonify({'message': f'Failed to fetch daily sums batch: {str(e)}'}), 500