from flask import Blueprint, request, jsonify, current_app
from models import db, User
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
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
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

        print("Login successful!")  # Debug log
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    print("Received registration data:", data)  # For debugging

    required_fields = ['userName', 'firstName', 'lastName', 'email', 'password', 'roleId']
    for field in required_fields:
        if field not in data or (isinstance(data[field], str) and not data[field].strip()):
            return jsonify({'message': f'Missing or empty required field: {field}'}), 400

    area_id = data.get('areaId')
    if area_id in [None, '', 'null', 0, '0']:
        area_id = None
    branch_id = data.get('branchId')
    if branch_id in [None, '', 'null', 0, '0']:
        branch_id = None

    if User.query.filter_by(userName=data['userName']).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400

    new_user = User(
        userName=data['userName'],
        firstName=data['firstName'],
        lastName=data['lastName'],
        email=data['email'],
        passwordHash=data['password'],  # In production, hash the password!
        roleId=data['roleId'],
        areaId=area_id,
        branchId=branch_id,
        isActive=True
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {str(e)}")
        return jsonify({'message': f'Failed to create user: {str(e)}'}), 500