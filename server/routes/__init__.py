from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.copy_routes import copy_bp
from routes.borrowing_routes import borrowing_bp
from routes.user_routes import user_bp
from routes.location_routes import location_bp
from routes.scan_routes import scan_bp
from routes.inventory_routes import inventory_bp
from routes.notification_routes import notification_bp
from routes.report_routes import report_bp


def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(book_bp, url_prefix='/api/books')
    app.register_blueprint(copy_bp, url_prefix='/api/copies')
    app.register_blueprint(borrowing_bp, url_prefix='/api/borrowings')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(location_bp, url_prefix='/api/locations')
    app.register_blueprint(scan_bp, url_prefix='/api/scans')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
