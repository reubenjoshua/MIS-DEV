from flask import Flask
from flask_cors import CORS
from models import db
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import all blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.area_routes import area_bp
from routes.branch_routes import branch_bp
from routes.source_routes import source_bp
from routes.status_routes import status_bp
from routes.daily_routes import daily_bp
from routes.monthly_routes import monthly_bp
from routes.role_routes import role_bp
from routes.dashboard_routes import dashboard_bp
from routes.branch_source import branch_source_bp
from routes.branch_source_name import branch_source_name_bp
from routes.source_name import source_name_bp

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS configuration
CORS(app,
     resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     max_age=3600
)

# App configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # seconds

# Initialize SQLAlchemy
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(area_bp)
app.register_blueprint(branch_bp)
app.register_blueprint(source_bp)
app.register_blueprint(status_bp)
app.register_blueprint(daily_bp)
app.register_blueprint(monthly_bp)
app.register_blueprint(role_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(branch_source_bp)
app.register_blueprint(branch_source_name_bp)
app.register_blueprint(source_name_bp)

# Optionally, add a health check or root endpoint
@app.route('/')
def home():
    return {"message": "API is running!"}

if __name__ == '__main__':
    logger.info("=== Starting Flask Server ===")
    logger.info("Server running on http://localhost:5000")
    logger.info("Debug mode: %s", True)
    app.run(debug=True)