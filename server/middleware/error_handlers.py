from flask import jsonify


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': str(e), 'status': 400}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'error': 'You do not have permission to perform this action.', 'status': 403}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'The requested resource could not be found.', 'status': 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed.', 'status': 405}), 405

    @app.errorhandler(409)
    def conflict(e):
        return jsonify({'error': str(e), 'status': 409}), 409

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({'error': str(e), 'status': 422}), 422

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.exception('Unhandled server error')
        return jsonify({'error': 'An unexpected error occurred. Please try again.', 'status': 500}), 500
