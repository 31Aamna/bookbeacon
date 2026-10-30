"""
BookBeacon Flask API — entry point.
Run with:  python app.py   or   flask run
"""
import os
import sys

# Ensure server/ is on sys.path so all relative imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from dotenv import load_dotenv

load_dotenv()


def create_app(config_object=None):
    app = Flask(__name__, instance_relative_config=False)

    # Load config
    if config_object is None:
        from config import Config
        app.config.from_object(Config)
    else:
        app.config.from_object(config_object)

    # Ensure instance directory exists
    os.makedirs(os.path.join(os.path.dirname(__file__), 'instance'), exist_ok=True)

    # Initialize extensions
    from extensions import db, migrate, jwt, cors
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    origins = app.config.get('CORS_ORIGINS', 'http://localhost:3000')
    cors.init_app(app, resources={r'/api/*': {
        'origins': origins.split(','),
        'methods': ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization'],
        'supports_credentials': True,
    }})

    # Register all model imports so SQLAlchemy knows about them
    with app.app_context():
        import models  # noqa: F401 — triggers all model __init__ imports

    # Register routes
    from routes import register_routes
    register_routes(app)

    # Health endpoint
    @app.get('/api/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'BookBeacon API'}), 200

    # Error handlers
    from middleware.error_handlers import register_error_handlers
    register_error_handlers(app)

    return app


if __name__ == '__main__':
    app = create_app()
    # Create tables if they don't exist (development convenience)
    with app.app_context():
        from extensions import db
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
