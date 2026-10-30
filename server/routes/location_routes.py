from flask import Blueprint, jsonify
from models.location import Library, Shelf

location_bp = Blueprint('locations', __name__)


def _ok(data):
    return jsonify({'data': data}), 200


@location_bp.get('/map')
def get_library_map():
    """Return the full library map matching the frontend libraryMap shape."""
    library = Library.query.first()
    if not library:
        return jsonify({'data': None}), 200
    return _ok(library.to_dict())


@location_bp.get('')
def get_zones():
    library = Library.query.first()
    if not library:
        return _ok([])
    return _ok([z.to_dict() for z in library.zones])


@location_bp.get('/shelves')
def get_shelves():
    """Return flat list of all shelves (matches frontend 'locations' array)."""
    shelves = Shelf.query.all()
    return _ok([s.to_dict() for s in shelves])


@location_bp.get('/<location_id>')
def get_location(location_id):
    shelf = Shelf.query.get(location_id)
    if not shelf:
        return jsonify({'message': 'That shelf could not be found.'}), 404
    return _ok(shelf.to_dict())
