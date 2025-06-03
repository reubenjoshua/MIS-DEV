from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
from functools import wraps
import pyodbc
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Add request logging middleware
@app.before_request
def log_request_info():
    print("\n=== Incoming Request ===")
    print(f"Method: {request.method}")
    print(f"URL: {request.url}")
    print(f"Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"Body: {request.get_json()}")
    print("======================\n")

# Configure CORS
CORS(app,
     resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     max_age=3600
)


# Error handling middleware
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:5173", "http://localhost:5174"]:
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Initialize SQLAlchemy
db = SQLAlchemy(app)


# Test database connection
@app.route('/api/test-db')
def test_db():
    print("\n=== Testing Database Connection ===")  # Debug log
    try:
        # Try to connect to the database
        db.session.execute(text('SELECT 1'))
        print("Database connection successful!")  # Debug log
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful'
        })
    except Exception as e:
        print(f"Database connection failed: {str(e)}")  # Debug log
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}'
        }), 500


# Models
class User(db.Model):
    __tablename__ = 'User'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roleId = db.Column(db.Integer, db.ForeignKey('Role.id'))
    areaId = db.Column(db.Integer, db.ForeignKey('Area.id'))
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    monthlyEncoded = db.Column(db.Integer)
    dailyEncoded = db.Column(db.Integer)
    userName = db.Column(db.String(64))
    firstName = db.Column(db.String(64))
    lastName = db.Column(db.String(64))
    email = db.Column(db.String(64))
    passwordHash = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

    def to_dict(self):
        role = Role.query.get(self.roleId)
        area = Area.query.get(self.areaId)
        branch = Branch.query.get(self.branchId)
        return {
            'id': self.id,
            'roleId': self.roleId,
            'roleName': role.roleName if role else None,
            'areaId': self.areaId,
            'areaName': area.areaName if area else None,
            'branchId': self.branchId,
            'branchName': branch.branchName if branch else None,
            'firstName': self.firstName,
            'lastName': self.lastName,
            'email': self.email,
            'isActive': self.isActive,
            'username': self.userName,
            'monthlyEncoded': self.monthlyEncoded,
            'dailyEncoded': self.dailyEncoded
        }


class Role(db.Model):
    __tablename__ = 'Role'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roleName = db.Column(db.String(64))
    description = db.Column(db.String(256))


class Area(db.Model):
    __tablename__ = 'Area'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    areaCode = db.Column(db.Integer, nullable=False)
    areaName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)


class Branch(db.Model):
    __tablename__ = 'Branch'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    areaId = db.Column(db.Integer, db.ForeignKey('Area.id'))
    branchCode = db.Column(db.Integer)
    branchName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)


class Daily(db.Model):
    __tablename__ = 'Daily'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    monthlyId = db.Column(db.Integer, db.ForeignKey('Monthly.id'))
    sourceType = db.Column(db.String(64))
    sourceName = db.Column(db.String(64))
    status = db.Column(db.String(32))
    byUser = db.Column(db.Integer, db.ForeignKey('User.id'))
    date = db.Column(db.DateTime)
    productionVolume = db.Column(db.Float)
    operationHours = db.Column(db.Float)
    serviceInterruption = db.Column(db.Boolean)
    totalHoursServiceInterruption = db.Column(db.Float)
    electricityConsumption = db.Column(db.Float)
    VFDFrequency = db.Column(db.Float)
    spotFlow = db.Column(db.Float)
    spotPressure = db.Column(db.Float)
    timeSpotMeasurements = db.Column(db.DateTime)
    lineVoltage1 = db.Column(db.Float)
    lineVoltage2 = db.Column(db.Float)
    lineVoltage3 = db.Column(db.Float)
    lineCurrent1 = db.Column(db.Float)
    lineCurrent2 = db.Column(db.Float)
    lineCurrent3 = db.Column(db.Float)
    comment = db.Column(db.String(512))
    isActive = db.Column(db.Boolean)


class Monthly(db.Model):
    __tablename__ = 'Monthly'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceType = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    sourceName = db.Column(db.Integer)
    status = db.Column(db.Integer, db.ForeignKey('Status.id'))
    byUser = db.Column(db.Integer)
    month = db.Column(db.String(32))
    year = db.Column(db.Integer)
    electricityConsumption = db.Column(db.Float)
    electricityCost = db.Column(db.Float)
    bulkCost = db.Column(db.Float)
    bulkOuttake = db.Column(db.Float)
    bulkProvider = db.Column(db.Float)
    WTPCost = db.Column(db.Float)
    WTPSource = db.Column(db.Float)
    WTPVolume = db.Column(db.Float)
    disinfectionMode = db.Column(db.String(128))
    disinfectantCost = db.Column(db.Float)
    disinfectionAmount = db.Column(db.Float)
    disinfectionBrandType = db.Column(db.String(128))
    otherTreatmentCost = db.Column(db.Float)
    emergencyLitersConsumed = db.Column(db.Float)
    emergencyFuelCost = db.Column(db.Float)
    emergencyTotalHoursUsed = db.Column(db.Float)
    gensetLitersConsumed = db.Column(db.Float)
    gensetFuelCost = db.Column(db.Float)
    isActive = db.Column(db.Boolean)
    comment = db.Column(db.String(1024))


class SourceType(db.Model):
    __tablename__ = 'sourceType'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceType = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)


class SourceName(db.Model):
    __tablename__ = 'sourceName'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branchId = db.Column(db.Integer, db.ForeignKey('Branch.id'))
    sourceTypeId = db.Column(db.Integer, db.ForeignKey('sourceType.id'))
    sourceName = db.Column(db.String(64))
    isActive = db.Column(db.Boolean)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branchId,
            'sourceTypeId': self.sourceTypeId,
            'sourceName': self.sourceName,
            'isActive': self.isActive
        }


class Status(db.Model):
    __tablename__ = 'Status'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    statusName = db.Column(db.String(16))

    def to_dict(self):
        return {
            'id': self.id,
            'statusName': self.statusName
        }


# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)

    return decorated


# Routes
@app.route('/api')
def home():
    return jsonify({
        "message": "Welcome to the API",
        "version": "1.0.0",
        "endpoints": {
            "test_db": "/api/test-db",
            "login": "/api/auth/login",
            "profile": "/api/user/profile",
            "users": "/api/users",
            "areas": "/api/areas",
            "branches": "/api/branches",
            "roles": "/api/roles",
            "daily": "/api/daily",
            "monthly": "/api/monthly"
        }
    })


# Auth routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    print("\n=== Login Attempt ===")  # Debug log
    try:
        data = request.get_json()
        print(f"Received login request data: {data}")  # Debug log

        if not data or not data.get('username') or not data.get('password'):
            print("Missing username or password")  # Debug log
            return jsonify({'message': 'Missing username or password'}), 400

        # Case-insensitive username search
        user = User.query.filter(User.userName.ilike(data['username'])).first()
        print(f"Found user: {user.userName if user else 'None'}")  # Debug log

        if not user or not user.passwordHash == data['password']:  # In production, use proper password hashing!
            print("Invalid credentials")  # Debug log
            return jsonify({'message': 'Invalid username or password'}), 401

        if not user.isActive:
            print("Account inactive")  # Debug log
            return jsonify({'message': 'Account is inactive'}), 401

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, app.config['JWT_SECRET_KEY'])

        print("Login successful!")  # Debug log
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({'message': f'Login failed: {str(e)}'}), 500


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    print("Received registration data:", data)  # For debugging

    required_fields = ['userName', 'firstName', 'lastName', 'email', 'password', 'roleId']
    for field in required_fields:
        # Only check for empty string on string fields
        if field not in data or (isinstance(data[field], str) and not data[field].strip()):
            return jsonify({'message': f'Missing or empty required field: {field}'}), 400

    # areaId and branchId are optional
    area_id = data.get('areaId')
    if area_id in [None, '', 'null', 0, '0']:
        area_id = None
    branch_id = data.get('branchId')
    if branch_id in [None, '', 'null', 0, '0']:
        branch_id = None

    # Check if username or email already exists
    if User.query.filter_by(userName=data['userName']).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    # Create new user
    new_user = User(
        userName=data['userName'],
        firstName=data['firstName'],
        lastName=data['lastName'],
        email=data['email'],
        passwordHash=data['password'],  # In production, hash the password!
        roleId=data['roleId'],
        areaId=area_id,
        branchId=branch_id,
        isActive=True,
        monthlyEncoded=None,
        dailyEncoded=None
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating user: {str(e)}")
        return jsonify({'message': f'Failed to create user: {str(e)}'}), 500


# User routes
@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        return jsonify(current_user.to_dict())
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500


@app.route('/api/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    try:
        users = User.query.all()
        app.logger.info(f"Found {len(users)} users")
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        app.logger.error(f"Error in get_all_users: {str(e)}")
        return jsonify({'message': f'Failed to get users: {str(e)}'}), 500


# Area routes
@app.route('/api/areas', methods=['GET'])
@token_required
def get_all_areas(current_user):
    try:
        # Add debug logging
        app.logger.info("Attempting to fetch areas...")

        # First check if the Area table exists
        try:
            db.session.execute(text("SELECT TOP 1 * FROM Area"))
            app.logger.info("Area table exists and is accessible")
        except Exception as table_error:
            app.logger.error(f"Error accessing Area table: {str(table_error)}")
            return jsonify({'message': f'Database table error: {str(table_error)}'}), 500

        # Try to get areas
        areas = Area.query.filter_by(isActive=True).all()
        app.logger.info(f"Successfully found {len(areas)} active areas")

        # Convert to dictionary and return
        area_list = [{
            'id': area.id,
            'areaCode': area.areaCode,
            'areaName': area.areaName,
            'isActive': area.isActive
        } for area in areas]

        app.logger.info("Successfully converted areas to JSON format")
        return jsonify(area_list)

    except Exception as e:
        app.logger.error(f"Error in get_all_areas: {str(e)}")
        app.logger.error(f"Error type: {type(e)}")
        import traceback
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'message': f'Failed to get areas: {str(e)}'}), 500


# Add a test endpoint for areas
@app.route('/api/test-areas', methods=['GET'])
def test_areas():
    try:
        # Try to get the first area without any filters
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
        app.logger.error(f"Error in test_areas: {str(e)}")
        import traceback
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'message': f'Error testing areas: {str(e)}'
        }), 500


# Branch routes
@app.route('/api/branches', methods=['GET'])
@token_required
def get_all_branches(current_user):
    try:
        branches = Branch.query.filter_by(isActive=True).all()
        return jsonify([{
            'id': branch.id,
            'areaId': branch.areaId,
            'branchCode': branch.branchCode,
            'branchName': branch.branchName,
            'isActive': branch.isActive
        } for branch in branches])
    except Exception as e:
        return jsonify({'message': f'Failed to get branches: {str(e)}'}), 500


# Role routes
@app.route('/api/roles', methods=['GET'])
@token_required
def get_all_roles(current_user):
    try:
        roles = Role.query.all()
        return jsonify([{
            'id': role.id,
            'roleName': role.roleName,
            'description': role.description
        } for role in roles])
    except Exception as e:
        return jsonify({'message': f'Failed to get roles: {str(e)}'}), 500


# Daily routes
@app.route('/api/daily', methods=['GET'])
@token_required
def get_all_daily(current_user):
    try:
        # Use SQLAlchemy model instead of raw SQL
        daily_reports = db.session.query(Daily).all()
        return jsonify([{
            'id': report.id,
            'monthlyId': report.monthlyId,
            'sourceType': report.sourceType,
            'sourceName': report.sourceName,
            'status': report.status,
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
            'isActive': report.isActive
        } for report in daily_reports])
    except Exception as e:
        app.logger.error(f"Error in get_all_daily: {str(e)}")
        return jsonify({'message': f'Failed to get daily reports: {str(e)}'}), 500


@app.route('/api/debug-counts')
def debug_counts():
    try:
        users = User.query.all()
        areas = Area.query.all()
        branches = Branch.query.all()
        return jsonify({
            "users": [u.to_dict() for u in users],
            "areas": [{"id": a.id, "areaCode": a.areaCode, "areaName": a.areaName, "isActive": a.isActive} for a in
                      areas],
            "branches": [{"id": b.id, "areaId": b.areaId, "branchCode": b.branchCode, "branchName": b.branchName,
                          "isActive": b.isActive} for b in branches]
        })
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()})


# Status routes
@app.route('/api/status', methods=['GET'])
@token_required
def get_all_status(current_user):
    statuses = Status.query.all()
    return jsonify([s.to_dict() for s in statuses])


# SourceType routes
@app.route('/api/source-types', methods=['GET'])
@token_required
def get_all_source_types(current_user):
    items = SourceType.query.all()
    return jsonify([item.to_dict() for item in items])


# SourceName routes
@app.route('/api/source-names', methods=['GET'])
@token_required
def get_all_source_names(current_user):
    items = SourceName.query.all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/source-names', methods=['POST'])
@token_required
def create_source_name(current_user):
    data = request.get_json()
    new_source_name = SourceName(
        branchId=data['branchId'],
        sourceTypeId=data['sourceTypeId'],
        sourceName=data['sourceName'],
        isActive=data['isActive', True]
    )
    db.session.add(new_source_name)
    db.session.commit()
    return jsonify(new_source_name.to_dict()), 201

@app.route('/api/branches', methods=['POST'])
@token_required
def create_branch(current_user):
    data = request.get_json()
    new_branch = Branch(
        areaId=data['areaId'],
        branchCode=data.get('branchCode', 0),
        branchName=data['branchName'],
        isActive=data.get(True)
    )
    db.session.add(new_branch)
    db.session.commit()
    return jsonify({
        'id': new_branch.id,
        'areaId': new_branch.areaId,
        'branchCode': new_branch.branchCode,
        'branchName': new_branch.branchName,
        'isActive': new_branch.isActive
    }), 201

# Monthly routes
@app.route('/api/monthly', methods=['GET'])
@token_required
def get_all_monthly(current_user):
    items = Monthly.query.all()

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

@app.route('/api/branch/full-create', methods=['POST'])
@token_required
def create_full_branch(current_user):
    data = request.get_json()

    # 1. Create Branch
    branch_data = data.get('branch')
    new_branch = Branch(
        areaId=branch_data['areaId'],
        branchName=branch_data['branchName'],
        isActive=branch_data.get('isActive', True)
    )
    db.session.add(new_branch)
    db.session.commit()

    # 2. Create Source Names
    source_names = data.get('sourceNames', [])
    for sn in source_names:
        new_source_name = SourceName(
            branchId=new_branch.id,
            sourceTypeId=sn.get('sourceTypeId'),
            sourceName=sn['sourceName'],
            isActive=True
        )
        db.session.add(new_source_name)

    # 3. Save Daily Datasheet (if present)
    daily_data = data.get('daily')
    if daily_data:
        daily_fields = daily_data.get('fields', {})
        new_daily = Daily(
            monthlyId=None,  # Set if you have a monthly record
            sourceType=daily_data.get('selectedSourceType', ''),
            sourceName=source_names[0]['sourceName'] if source_names else '',
            byUser=current_user.id,
            productionVolume=daily_fields.get('Production Volume', False),
            operationHours=daily_fields.get('Operation Hours', False),
            serviceInterruption=daily_fields.get('Number of Service Interruptions', False),
            totalHoursServiceInterruption=daily_fields.get('Total Number of Hours of Service Interruption', False),
            electricityConsumption=daily_fields.get('Electricity Consumption', False),
            VFDFrequency=daily_fields.get('VFD Frequency', False),
            spotFlow=daily_fields.get('Spot Flow', False),
            spotPressure=daily_fields.get('Spot Pressure', False),
            timeSpotMeasurements=None,  # Set if you have this data
            lineVoltage1=daily_fields.get('Line Voltage [L1-L2]', False),
            lineVoltage2=daily_fields.get('Line Voltage [L2-L3]', False),
            lineVoltage3=daily_fields.get('Line Voltage [L3-L1]', False),
            lineCurrent1=daily_fields.get('Line Current [L1-L2]', False),
            lineCurrent2=daily_fields.get('Line Current [L2-L3]', False),
            lineCurrent3=daily_fields.get('Line Current [L3-L1]', False),
            comment=None,
            isActive=True
        )
        db.session.add(new_daily)

    # 4. Save Monthly Datasheet (if present)
    monthly_data = data.get('monthly')
    if monthly_data:
        monthly_fields = monthly_data.get('fields', {})
        new_monthly = Monthly(
            branchId=new_branch.id,
            electricityConsumption=monthly_fields.get('Electricity Consumption', False),
            electricityCost=monthly_fields.get('Electricity Cost', False),
            bulkCost=monthly_fields.get('Bulk Cost', False),
            bulkOuttake=None,
            bulkProvider=monthly_fields.get('Name of Bulk Provider', False),
            WTPCost=monthly_fields.get('WTP Raw Water Cost', False),
            WTPSource=monthly_fields.get('WTP Raw Water Source', False),
            WTPVolume=monthly_fields.get('WTP Raw Water Volume', False),
            disinfectionMode=monthly_fields.get('Method of Disinfection', False),
            disinfectantCost=monthly_fields.get('Disinfectant Cost', False),
            disinfectionAmount=monthly_fields.get('Disinfection Amount', False),
            disinfectionBrandType=None,
            otherTreatmentCost=monthly_fields.get('Other Treatment Cost', False),
            emergencyLitersConsumed=monthly_fields.get('Liters Consumed - Emergency Operations', False),
            emergencyFuelCost=monthly_fields.get('Fuel Cost - Emergency Operations', False),
            emergencyTotalHoursUsed=monthly_fields.get('Total Hours Used - Emergency Operations', False),
            gensetLitersConsumed=monthly_fields.get('Liters Consumed - Genset Operated', False),
            gensetFuelCost=monthly_fields.get('Fuel Cost - Genset Operated', False),
            isActive=True,
            comment=None
        )
        db.session.add(new_monthly)

    db.session.commit()
    return jsonify({"message": "Branch and related data created successfully", "branchId": new_branch.id}), 201

@app.route('/api/dashboard-stats', methods=['GET'])
@token_required
def dashboard_stats(current_user):
    active_users = User.query.filter_by(isActive=True).count()
    areas = Area.query.count()
    branches = Branch.query.count()
    approved = 0  # Replace with your own logic if needed

    return jsonify({
        "ActiveUsers": active_users,
        "Areas": areas,
        "Branches": branches,
        "Approved": approved,
    })

if __name__ == '__main__':
    print("\n=== Starting Flask Server ===")
    print("Server running on http://localhost:5000")
    print("Debug mode:", True)
    app.run(debug=True)