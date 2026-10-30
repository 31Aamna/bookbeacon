"""
BookBeacon API test suite.
Run from server/ directory:
    python -m pytest tests/test_api.py -v
"""
import os
import sys
import json
import pytest

# Ensure server dir is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config import TestConfig
from extensions import db as _db


@pytest.fixture(scope='session')
def app():
    """Create a test application with a separate test database."""
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        _seed_test_data()
        yield app
        _db.drop_all()


@pytest.fixture(scope='session')
def client(app):
    return app.test_client()


def _seed_test_data():
    """Minimal seed for tests — users, library map, a book, a copy."""
    from models.user import User
    from models.book import Book
    from models.book_copy import BookCopy
    from models.location import Library, Zone, Section, Shelf

    # Users
    student = User(id='USER-T01', name='Test Student', email='teststudent@test.local',
                   identifier='S-TEST-001', role='student', department='Testing', active=True)
    student.set_password('TestPass123!')
    _db.session.add(student)

    librarian = User(id='USER-T02', name='Test Librarian', email='testlibrarian@test.local',
                     identifier='L-TEST-001', role='librarian', department='Library', active=True)
    librarian.set_password('TestPass123!')
    _db.session.add(librarian)

    inactive = User(id='USER-T03', name='Inactive User', email='inactive@test.local',
                    identifier='S-TEST-002', role='student', department='Testing', active=False)
    inactive.set_password('TestPass123!')
    _db.session.add(inactive)

    # Library locations
    lib = Library(id='LIB-T01', name='Test Library', entrance_label='Entrance',
                  entrance_zone_id='ZONE-T1', reading_area_label='Reading',
                  circulation_desk_label='Desk')
    _db.session.add(lib)
    zone = Zone(id='ZONE-T1', library_id='LIB-T01', code='T', name='Test Zone', floor='L1')
    _db.session.add(zone)
    section = Section(id='SEC-T01', zone_id='ZONE-T1', code='01', name='Test Section')
    _db.session.add(section)
    shelf1 = Shelf(id='SHELF-T-01', section_id='SEC-T01', shelf_code='T-01', display_name='Shelf T-01')
    shelf2 = Shelf(id='SHELF-T-02', section_id='SEC-T01', shelf_code='T-02', display_name='Shelf T-02')
    _db.session.add(shelf1)
    _db.session.add(shelf2)

    # A book with a copy
    book = Book(id='BOOK-T01', title='Test Algorithms', isbn='9781234567890',
                category='Testing', publisher='Test Press', publication_year=2024,
                description='A test book.')
    book.set_authors(['Test Author'])
    _db.session.add(book)

    copy = BookCopy(id='BB-T001', book_id='BOOK-T01', qr_code='BB-T001',
                    status='AVAILABLE', shelf_id='SHELF-T-01')
    _db.session.add(copy)

    copy2 = BookCopy(id='BB-T002', book_id='BOOK-T01', qr_code='BB-T002',
                     status='AVAILABLE', shelf_id='SHELF-T-02')
    _db.session.add(copy2)

    _db.session.commit()


def _login(client, email, password='TestPass123!'):
    """Helper: login and return the JWT token."""
    resp = client.post('/api/auth/login',
                       data=json.dumps({'identifier': email, 'password': password}),
                       content_type='application/json')
    data = json.loads(resp.data)
    return data.get('data', {}).get('token') or data.get('data', {}).get('access_token')


def _auth_header(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


# ──────────────────── HEALTH ────────────────────

class TestHealth:
    def test_health(self, client):
        resp = client.get('/api/health')
        assert resp.status_code == 200
        data = json.loads(resp.data)
        assert data['status'] == 'ok'


# ──────────────────── AUTH ────────────────────

class TestAuth:
    def test_register_student(self, client):
        resp = client.post('/api/auth/register', data=json.dumps({
            'fullName': 'New Student',
            'email': 'newstudent@test.local',
            'identifier': 'S-NEW-001',
            'department': 'Testing',
            'password': 'NewPass123!',
            'confirmPassword': 'NewPass123!',
        }), content_type='application/json')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['user']['role'] == 'student'
        assert data['token'] is not None

    def test_register_duplicate_email(self, client):
        resp = client.post('/api/auth/register', data=json.dumps({
            'fullName': 'Dupe User',
            'email': 'teststudent@test.local',
            'identifier': 'S-DUPE-001',
            'department': 'Testing',
            'password': 'DupePass123!',
            'confirmPassword': 'DupePass123!',
        }), content_type='application/json')
        assert resp.status_code == 409

    def test_register_validation(self, client):
        resp = client.post('/api/auth/register', data=json.dumps({
            'fullName': '',
            'email': 'bad',
            'identifier': '',
            'department': '',
            'password': 'short',
            'confirmPassword': 'mismatch',
        }), content_type='application/json')
        assert resp.status_code == 422
        data = json.loads(resp.data)
        assert 'fieldErrors' in data

    def test_login_student(self, client):
        resp = client.post('/api/auth/login', data=json.dumps({
            'identifier': 'teststudent@test.local',
            'password': 'TestPass123!',
        }), content_type='application/json')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['user']['role'] == 'student'
        assert data['user']['name'] == 'Test Student'

    def test_login_librarian(self, client):
        resp = client.post('/api/auth/login', data=json.dumps({
            'identifier': 'testlibrarian@test.local',
            'password': 'TestPass123!',
        }), content_type='application/json')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['user']['role'] == 'librarian'

    def test_login_by_identifier(self, client):
        resp = client.post('/api/auth/login', data=json.dumps({
            'identifier': 'S-TEST-001',
            'password': 'TestPass123!',
        }), content_type='application/json')
        assert resp.status_code == 200

    def test_login_wrong_password(self, client):
        resp = client.post('/api/auth/login', data=json.dumps({
            'identifier': 'teststudent@test.local',
            'password': 'WrongPassword!',
        }), content_type='application/json')
        assert resp.status_code == 401

    def test_login_inactive_user(self, client):
        resp = client.post('/api/auth/login', data=json.dumps({
            'identifier': 'inactive@test.local',
            'password': 'TestPass123!',
        }), content_type='application/json')
        assert resp.status_code == 401

    def test_me_authenticated(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/auth/me', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['user']['email'] == 'teststudent@test.local'

    def test_me_unauthenticated(self, client):
        resp = client.get('/api/auth/me')
        assert resp.status_code == 401

    def test_logout(self, client):
        resp = client.post('/api/auth/logout')
        assert resp.status_code == 200


# ──────────────────── BOOKS ────────────────────

class TestBooks:
    def test_list_books(self, client):
        resp = client.get('/api/books')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)
        assert any(b['id'] == 'BOOK-T01' for b in data)

    def test_search_books(self, client):
        resp = client.get('/api/books?q=algorithms')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert any(b['title'] == 'Test Algorithms' for b in data)

    def test_get_book_by_id(self, client):
        resp = client.get('/api/books/BOOK-T01')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['title'] == 'Test Algorithms'
        assert 'copies' in data
        assert data['totalCopies'] >= 1

    def test_get_book_not_found(self, client):
        resp = client.get('/api/books/BOOK-NONEXISTENT')
        assert resp.status_code == 404

    def test_create_book_as_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/books', data=json.dumps({
            'title': 'New Test Book',
            'author': 'Jane Author',
            'isbn': '9789999999999',
            'category': 'Testing',
            'publisher': 'Test House',
            'publicationYear': 2025,
        }), headers=_auth_header(token))
        assert resp.status_code == 201
        data = json.loads(resp.data)['data']
        assert data['title'] == 'New Test Book'
        assert 'BOOK-' in data['id']

    def test_create_book_as_student_forbidden(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.post('/api/books', data=json.dumps({
            'title': 'Unauthorized Book',
            'author': 'No Auth',
            'isbn': '9780000000000',
            'category': 'Testing',
        }), headers=_auth_header(token))
        assert resp.status_code == 403

    def test_create_book_validation(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/books', data=json.dumps({
            'title': '',
            'isbn': '',
            'category': '',
        }), headers=_auth_header(token))
        assert resp.status_code == 422

    def test_update_book(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.patch('/api/books/BOOK-T01', data=json.dumps({
            'description': 'Updated description for testing.',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['description'] == 'Updated description for testing.'


# ──────────────────── COPIES ────────────────────

class TestCopies:
    def test_list_copies(self, client):
        resp = client.get('/api/copies')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)

    def test_list_copies_by_book(self, client):
        resp = client.get('/api/copies?bookId=BOOK-T01')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert all(c['bookId'] == 'BOOK-T01' for c in data)

    def test_create_copy_as_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/copies', data=json.dumps({
            'id': 'BB-T099',
            'bookId': 'BOOK-T01',
            'locationId': 'SHELF-T-01',
        }), headers=_auth_header(token))
        assert resp.status_code == 201
        data = json.loads(resp.data)['data']
        assert data['id'] == 'BB-T099'
        assert data['status'] == 'AVAILABLE'

    def test_create_copy_duplicate(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/copies', data=json.dumps({
            'id': 'BB-T001',
            'bookId': 'BOOK-T01',
            'locationId': 'SHELF-T-01',
        }), headers=_auth_header(token))
        assert resp.status_code == 409

    def test_update_copy_location(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.patch('/api/copies/BB-T002', data=json.dumps({
            'locationId': 'SHELF-T-02',
        }), headers=_auth_header(token))
        assert resp.status_code == 200


# ──────────────────── BORROWING ────────────────────

class TestBorrowing:
    def test_issue_book(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/borrowings/issue', data=json.dumps({
            'userId': 'USER-T01',
            'copyId': 'BB-T001',
        }), headers=_auth_header(token))
        assert resp.status_code == 201
        data = json.loads(resp.data)['data']
        assert data['status'] == 'ISSUED'
        assert data['userId'] == 'USER-T01'
        assert data['copyId'] == 'BB-T001'

    def test_issue_duplicate_prevents(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/borrowings/issue', data=json.dumps({
            'userId': 'USER-T01',
            'copyId': 'BB-T001',
        }), headers=_auth_header(token))
        assert resp.status_code == 409

    def test_issue_as_student_forbidden(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.post('/api/borrowings/issue', data=json.dumps({
            'userId': 'USER-T01',
            'copyId': 'BB-T002',
        }), headers=_auth_header(token))
        assert resp.status_code == 403

    def test_get_all_transactions_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/borrowings', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_all_transactions_student_forbidden(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/borrowings', headers=_auth_header(token))
        assert resp.status_code == 403

    def test_get_my_borrowed_books(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/borrowings/my', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)
        assert all(t['userId'] == 'USER-T01' for t in data)

    def test_return_book(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/borrowings/return', data=json.dumps({
            'copyId': 'BB-T001',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['transaction']['status'] == 'RETURNED'

    def test_return_no_active_loan(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/borrowings/return', data=json.dumps({
            'copyId': 'BB-T001',
        }), headers=_auth_header(token))
        assert resp.status_code == 409


# ──────────────────── QR / SCANS ────────────────────

class TestScans:
    def test_lookup_copy(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/scans/lookup?identifier=BB-T001', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['id'] == 'BB-T001'

    def test_lookup_not_found(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/scans/lookup?identifier=NOPE', headers=_auth_header(token))
        assert resp.status_code == 200
        assert json.loads(resp.data)['data'] is None

    def test_verify_scan(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.post('/api/scans/verify', data=json.dumps({
            'identifier': 'BB-T002',
            'scanType': 'MANUAL_DEMO',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['valid'] is True

    def test_verify_scan_mismatch(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.post('/api/scans/verify', data=json.dumps({
            'identifier': 'BB-T002',
            'observedLocationId': 'SHELF-T-01',
            'scanType': 'MANUAL_DEMO',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['valid'] is True
        assert data['mismatch'] is True

    def test_scan_logs_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/scans', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)


# ──────────────────── LOCATIONS ────────────────────

class TestLocations:
    def test_library_map(self, client):
        resp = client.get('/api/locations/map')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['name'] == 'Test Library'
        assert len(data['zones']) >= 1

    def test_get_zones(self, client):
        resp = client.get('/api/locations')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)

    def test_get_shelves(self, client):
        resp = client.get('/api/locations/shelves')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert any(s['id'] == 'SHELF-T-01' for s in data)

    def test_get_shelf_by_id(self, client):
        resp = client.get('/api/locations/SHELF-T-01')
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['shelfCode'] == 'T-01'


# ──────────────────── INVENTORY ────────────────────

class TestInventory:
    def test_inventory_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/inventory', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)

    def test_misplaced_alerts(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/inventory/misplaced', headers=_auth_header(token))
        assert resp.status_code == 200

    def test_run_audit(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.post('/api/inventory/audit', data=json.dumps({'mode': 'run'}),
                           headers=_auth_header(token))
        assert resp.status_code == 201
        data = json.loads(resp.data)['data']
        assert 'AUDIT-' in data['id']
        assert data['copyCount'] >= 1


# ──────────────────── NOTIFICATIONS ────────────────────

class TestNotifications:
    def test_get_notifications(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/notifications', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)

    def test_get_notifications_unauthenticated(self, client):
        resp = client.get('/api/notifications')
        assert resp.status_code == 401


# ──────────────────── USERS ────────────────────

class TestUsers:
    def test_list_users_as_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/users', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)
        assert any(u['id'] == 'USER-T01' for u in data)
        # Check enrichment fields
        user = next(u for u in data if u['id'] == 'USER-T01')
        assert 'activeBorrowings' in user
        assert 'outstandingFines' in user

    def test_list_users_as_student_forbidden(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/users', headers=_auth_header(token))
        assert resp.status_code == 403

    def test_student_view_own_profile(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/users/USER-T01', headers=_auth_header(token))
        assert resp.status_code == 200

    def test_student_cannot_view_other_profile(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/users/USER-T02', headers=_auth_header(token))
        assert resp.status_code == 403

    def test_update_own_profile(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.patch('/api/users/USER-T01', data=json.dumps({
            'department': 'Updated Department',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['department'] == 'Updated Department'

    def test_student_cannot_change_role(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.patch('/api/users/USER-T01', data=json.dumps({
            'role': 'librarian',
        }), headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert data['role'] == 'student'  # Role unchanged


# ──────────────────── REPORTS ────────────────────

class TestReports:
    def test_summary_as_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/reports/summary', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert 'totalTitles' in data
        assert 'totalCopies' in data
        assert 'availableCopies' in data
        assert 'issuedCopies' in data
        assert 'categories' in data
        assert 'activity' in data
        assert 'transactions' in data

    def test_activity_as_librarian(self, client):
        token = _login(client, 'testlibrarian@test.local')
        resp = client.get('/api/reports/activity', headers=_auth_header(token))
        assert resp.status_code == 200
        data = json.loads(resp.data)['data']
        assert isinstance(data, list)

    def test_summary_as_student_forbidden(self, client):
        token = _login(client, 'teststudent@test.local')
        resp = client.get('/api/reports/summary', headers=_auth_header(token))
        assert resp.status_code == 403
