"""
BookBeacon database initialisation and seed script.
Usage (from server/ directory):
    python scripts/seed_db.py

Safe to run repeatedly — checks for existing records before inserting.
Never resets or drops existing data.
"""
import sys
import os
import json

# Resolve paths
SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SERVER_DIR)

from app import create_app
from extensions import db
from models.user import User
from models.book import Book
from models.location import Library, Zone, Section, Shelf
from models.book_copy import BookCopy
from models.borrowing import BorrowingTransaction
from models.scan_log import ScanLog
from models.misplaced_alert import MisplacedAlert
from models.notification import Notification
from models.inventory_audit import InventoryAudit
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash


def days_from_now(delta, hour=12):
    d = datetime.now(timezone.utc) + timedelta(days=delta)
    return d.replace(hour=hour, minute=0, second=0, microsecond=0)


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        # ── USERS ────────────────────────────────────────────────────────────
        user_data = [
            dict(id='USER-001', name='Alex Morgan', email='student@bookbeacon.demo',
                 identifier='S-2024-001', role='student', department='Computer Science',
                 joined_at=datetime(2024, 9, 2, 9, 0, tzinfo=timezone.utc)),
            dict(id='USER-002', name='Priya Nair', email='priya.nair@bookbeacon.demo',
                 identifier='S-2023-018', role='student', department='Information Systems',
                 joined_at=datetime(2023, 9, 6, 9, 0, tzinfo=timezone.utc)),
            dict(id='USER-003', name='Mateo Chen', email='mateo.chen@bookbeacon.demo',
                 identifier='S-2024-042', role='student', department='Computer Engineering',
                 joined_at=datetime(2024, 9, 5, 9, 0, tzinfo=timezone.utc)),
            dict(id='USER-004', name='Samira Patel', email='samira.patel@bookbeacon.demo',
                 identifier='S-2022-031', role='student', department='Mathematics',
                 joined_at=datetime(2022, 9, 1, 9, 0, tzinfo=timezone.utc)),
            dict(id='USER-005', name='Jordan Lee', email='jordan.lee@bookbeacon.demo',
                 identifier='S-2025-006', role='student', department='Physics',
                 joined_at=datetime(2025, 9, 3, 9, 0, tzinfo=timezone.utc)),
            dict(id='USER-006', name='Maya Thompson', email='librarian@bookbeacon.demo',
                 identifier='L-STAFF-001', role='librarian', department='Library Services',
                 joined_at=datetime(2021, 3, 15, 9, 0, tzinfo=timezone.utc)),
        ]
        DEMO_PASSWORD = 'Beacon2026!'
        for ud in user_data:
            if not User.query.get(ud['id']):
                user = User(
                    id=ud['id'], name=ud['name'], email=ud['email'],
                    identifier=ud['identifier'], role=ud['role'],
                    department=ud['department'], active=True,
                    joined_at=ud['joined_at'],
                )
                user.set_password(DEMO_PASSWORD)
                db.session.add(user)
        db.session.flush()
        print('[OK] Users seeded')

        # ── LIBRARY MAP ───────────────────────────────────────────────────────
        if not Library.query.get('LIB-001'):
            lib = Library(
                id='LIB-001', name='Engineering Library',
                entrance_label='Main entrance', entrance_zone_id='ZONE-A',
                reading_area_label='Quiet reading room',
                circulation_desk_label='Circulation desk',
            )
            db.session.add(lib)
            db.session.flush()

            zones_data = [
                ('ZONE-A', 'A', 'Technology Commons', 'Level 1', [
                    ('SECTION-01', '01', 'Computing foundations', [('SHELF-A-05', 'A-05', 'Shelf A-05')]),
                    ('SECTION-02', '02', 'Software practice', [('SHELF-A-06', 'A-06', 'Shelf A-06'), ('SHELF-A-07', 'A-07', 'Shelf A-07')]),
                    ('SECTION-03', '03', 'Algorithms & systems', [('SHELF-A-04', 'A-04', 'Shelf A-04'), ('SHELF-A-08', 'A-08', 'Shelf A-08'), ('SHELF-A-09', 'A-09', 'Shelf A-09'), ('SHELF-A-10', 'A-10', 'Shelf A-10')]),
                ]),
                ('ZONE-B', 'B', 'Research & Data', 'Level 2', [
                    ('SECTION-04', '04', 'Data & databases', [('SHELF-B-01', 'B-01', 'Shelf B-01'), ('SHELF-B-02', 'B-02', 'Shelf B-02')]),
                    ('SECTION-05', '05', 'Mathematical sciences', [('SHELF-B-03', 'B-03', 'Shelf B-03'), ('SHELF-B-04', 'B-04', 'Shelf B-04'), ('SHELF-B-05', 'B-05', 'Shelf B-05')]),
                    ('SECTION-06', '06', 'Interdisciplinary study', [('SHELF-B-06', 'B-06', 'Shelf B-06'), ('SHELF-B-07', 'B-07', 'Shelf B-07')]),
                ]),
                ('ZONE-C', 'C', 'Humanities & Science', 'Level 3', [
                    ('SECTION-07', '07', 'Literature', [('SHELF-C-01', 'C-01', 'Shelf C-01'), ('SHELF-C-02', 'C-02', 'Shelf C-02')]),
                    ('SECTION-08', '08', 'Life and physical sciences', [('SHELF-C-03', 'C-03', 'Shelf C-03'), ('SHELF-C-04', 'C-04', 'Shelf C-04')]),
                    ('SECTION-09', '09', 'General collection', [('SHELF-C-05', 'C-05', 'Shelf C-05'), ('SHELF-C-06', 'C-06', 'Shelf C-06')]),
                ]),
            ]
            for zone_id, code, name, floor, sections in zones_data:
                if not Zone.query.get(zone_id):
                    zone = Zone(id=zone_id, library_id='LIB-001', code=code, name=name, floor=floor)
                    db.session.add(zone)
                    for sec_id, sec_code, sec_name, shelves in sections:
                        if not Section.query.get(sec_id):
                            section = Section(id=sec_id, zone_id=zone_id, code=sec_code, name=sec_name)
                            db.session.add(section)
                            for shelf_id, shelf_code, display_name in shelves:
                                if not Shelf.query.get(shelf_id):
                                    shelf = Shelf(id=shelf_id, section_id=sec_id, shelf_code=shelf_code, display_name=display_name)
                                    db.session.add(shelf)
            db.session.flush()
        print('[OK] Library map seeded')

        # ── BOOKS ─────────────────────────────────────────────────────────────
        books_data = [
            ('BOOK-001', 'Introduction to Algorithms', ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'], '9780262046305', 'Algorithms', 'MIT Press', 2022, 'A comprehensive reference on the design and analysis of algorithms.', '#174d62', '#c8e5d8', 0),
            ('BOOK-002', 'Database System Concepts', ['Abraham Silberschatz', 'Henry F. Korth', 'S. Sudarshan'], '9781260084504', 'Database Management', 'McGraw Hill', 2019, 'A clear introduction to database design, relational systems, transactions and modern data platforms.', '#815b37', '#f0d7a9', 8),
            ('BOOK-003', 'Computer Organization and Design', ['David A. Patterson', 'John L. Hennessy'], '9780128201091', 'Computer Architecture', 'Morgan Kaufmann', 2021, 'The hardware and software interface.', '#394b7d', '#d0d8f0', 16),
            ('BOOK-004', 'Learning React', ['Alex Banks', 'Eve Porcello'], '9781492051725', 'Web Development', "O'Reilly Media", 2020, 'Build user interfaces with modern React.', '#246b73', '#bde7df', 24),
            ('BOOK-005', 'Clean Code', ['Robert C. Martin'], '9780132350884', 'Computer Science', 'Prentice Hall', 2008, 'Principles for writing readable and maintainable software.', '#6f3c3a', '#f0c9b8', 32),
            ('BOOK-006', 'Introduction to Linear Algebra', ['Gilbert Strang'], '9780980232776', 'Mathematics', 'Wellesley-Cambridge Press', 2016, 'A geometric and computational introduction to vectors and matrices.', '#47634e', '#d9e2b9', 40),
            ('BOOK-007', 'Dune', ['Frank Herbert'], '9780441172719', 'Literature', 'Ace Books', 1965, 'A landmark science-fiction novel.', '#916032', '#f2d39a', 48),
            ('BOOK-008', 'A Brief History of Time', ['Stephen Hawking'], '9780553380163', 'Science', 'Bantam Books', 1998, "A reader-friendly exploration of the universe.", '#263e68', '#c4d2ec', 56),
            ('BOOK-009', 'Operating System Concepts', ['Abraham Silberschatz', 'Peter B. Galvin', 'Greg Gagne'], '9781119800361', 'Computer Science', 'Wiley', 2021, 'Core operating-system concepts.', '#364f55', '#cae1db', 64),
            ('BOOK-010', 'Designing Data-Intensive Applications', ['Martin Kleppmann'], '9781449373320', 'Database Management', "O'Reilly Media", 2017, 'Practical foundations for reliable, scalable data systems.', '#a44e35', '#f4d59e', 72),
            ('BOOK-011', 'The Pragmatic Programmer', ['David Thomas', 'Andrew Hunt'], '9780135957059', 'Web Development', 'Addison-Wesley', 2019, 'Timeless practices for software development.', '#60606e', '#ded6ef', 80),
            ('BOOK-012', 'Discrete Mathematics and Its Applications', ['Kenneth H. Rosen'], '9781259676512', 'Mathematics', 'McGraw Hill', 2019, 'Logic, proofs, sets, and discrete structures.', '#675577', '#e0d2e9', 88),
            ('BOOK-013', 'To Kill a Mockingbird', ['Harper Lee'], '9780061120084', 'Literature', 'Harper Perennial', 2006, 'A classic novel about justice and empathy.', '#567263', '#dce5bd', 96),
            ('BOOK-014', 'Cosmos', ['Carl Sagan'], '9780345539434', 'Science', 'Ballantine Books', 2013, "A sweeping account of the universe.", '#33465e', '#f2c97d', 104),
            ('BOOK-015', 'Data Structures and Algorithm Analysis in Java', ['Mark Allen Weiss'], '9780132847377', 'Algorithms', 'Pearson', 2011, 'Implementation-focused study of data structures.', '#765246', '#eddbbb', 112),
        ]
        for (book_id, title, authors, isbn, category, publisher, pub_year, desc, color, accent, day_offset) in books_data:
            if not Book.query.get(book_id):
                book = Book(
                    id=book_id, title=title, isbn=isbn, category=category,
                    publisher=publisher, publication_year=pub_year, description=desc,
                    cover_color=color, cover_accent=accent,
                    created_at=days_from_now(-day_offset),
                )
                book.set_authors(authors)
                db.session.add(book)
        db.session.flush()
        print('[OK] Books seeded')

        # ── COPIES ────────────────────────────────────────────────────────────
        copies_data = [
            ('BB-2048', 'BOOK-001', 'SHELF-A-04', 'AVAILABLE'),
            ('BB-2049', 'BOOK-001', 'SHELF-A-05', 'ISSUED'),
            ('BB-2050', 'BOOK-002', 'SHELF-B-01', 'ISSUED'),
            ('BB-2051', 'BOOK-002', 'SHELF-B-02', 'ISSUED'),
            ('BB-2052', 'BOOK-003', 'SHELF-B-03', 'AVAILABLE'),
            ('BB-2053', 'BOOK-003', 'SHELF-B-04', 'AVAILABLE'),
            ('BB-2054', 'BOOK-004', 'SHELF-C-01', 'ISSUED'),
            ('BB-2055', 'BOOK-004', 'SHELF-C-02', 'AVAILABLE'),
            ('BB-2056', 'BOOK-005', 'SHELF-A-06', 'MAINTENANCE'),
            ('BB-2057', 'BOOK-006', 'SHELF-B-05', 'AVAILABLE'),
            ('BB-2058', 'BOOK-007', 'SHELF-C-03', 'AVAILABLE'),
            ('BB-2059', 'BOOK-008', 'SHELF-C-04', 'ISSUED'),
            ('BB-2060', 'BOOK-009', 'SHELF-A-07', 'AVAILABLE'),
            ('BB-2061', 'BOOK-010', 'SHELF-A-08', 'ISSUED'),
            ('BB-2062', 'BOOK-011', 'SHELF-B-06', 'AVAILABLE'),
            ('BB-2063', 'BOOK-012', 'SHELF-C-05', 'AVAILABLE'),
            ('BB-2064', 'BOOK-013', 'SHELF-B-07', 'MAINTENANCE'),
            ('BB-2065', 'BOOK-014', 'SHELF-C-06', 'AVAILABLE'),
            ('BB-2066', 'BOOK-015', 'SHELF-A-09', 'AVAILABLE'),
            ('BB-2067', 'BOOK-015', 'SHELF-A-10', 'ISSUED'),
        ]
        for (copy_id, book_id, shelf_id, status) in copies_data:
            if not BookCopy.query.get(copy_id):
                copy = BookCopy(id=copy_id, book_id=book_id, qr_code=copy_id,
                                status=status, shelf_id=shelf_id,
                                last_scanned_at=days_from_now(-1))
                db.session.add(copy)
        db.session.flush()
        print('[OK] Copies seeded')

        # ── TRANSACTIONS ─────────────────────────────────────────────────────
        txn_data = [
            ('TXN-001', 'USER-001', 'BB-2049', -8, 6, None, 'ISSUED', 0, 'NONE'),
            ('TXN-002', 'USER-001', 'BB-2050', -17, -3, None, 'ISSUED', 0, 'UNPAID'),
            ('TXN-003', 'USER-002', 'BB-2051', -19, -5, None, 'ISSUED', 0, 'UNPAID'),
            ('TXN-004', 'USER-003', 'BB-2054', -16, -2, None, 'ISSUED', 0, 'UNPAID'),
            ('TXN-005', 'USER-004', 'BB-2059', -11, 3, None, 'ISSUED', 0, 'NONE'),
            ('TXN-006', 'USER-005', 'BB-2061', -4, 10, None, 'ISSUED', 0, 'NONE'),
            ('TXN-007', 'USER-002', 'BB-2067', -6, 8, None, 'ISSUED', 0, 'NONE'),
            ('TXN-008', 'USER-003', 'BB-2052', -15, -8, -1, 'RETURNED', 3.5, 'PAID'),
            ('TXN-009', 'USER-004', 'BB-2053', -18, -4, -3, 'RETURNED', 0.5, 'PAID'),
            ('TXN-010', 'USER-001', 'BB-2062', -12, 2, -4, 'RETURNED', 0, 'NONE'),
        ]
        for (txn_id, user_id, copy_id, issue_off, due_off, ret_off, status, fine, pay_status) in txn_data:
            if not BorrowingTransaction.query.get(txn_id):
                txn = BorrowingTransaction(
                    id=txn_id, user_id=user_id, copy_id=copy_id,
                    issued_at=days_from_now(issue_off),
                    due_at=days_from_now(due_off),
                    returned_at=days_from_now(ret_off) if ret_off is not None else None,
                    status=status, fine_amount=fine, payment_status=pay_status,
                )
                db.session.add(txn)
        db.session.flush()
        print('[OK] Transactions seeded')

        # ── SCAN LOGS ─────────────────────────────────────────────────────────
        scan_data = [
            ('SCAN-001', 'BB-2048', 'SHELF-A-04', 'SHELF-A-04', 0, 'INVENTORY', 'MATCH', None),
            ('SCAN-002', 'BB-2055', 'SHELF-C-02', 'SHELF-B-07', -1, 'MANUAL_DEMO', 'SIMULATED_MISMATCH', None),
            ('SCAN-003', 'BB-2065', 'SHELF-C-06', 'SHELF-A-08', -2, 'INVENTORY', 'SIMULATED_MISMATCH', None),
            ('SCAN-004', 'BB-2049', 'SHELF-A-05', 'SHELF-A-05', -1, 'ISSUE', 'MATCH', 'TXN-001'),
            ('SCAN-005', 'BB-2050', 'SHELF-B-01', 'SHELF-B-01', -3, 'ISSUE', 'MATCH', 'TXN-002'),
            ('SCAN-006', 'BB-2051', 'SHELF-B-02', 'SHELF-B-02', -5, 'ISSUE', 'MATCH', 'TXN-003'),
            ('SCAN-007', 'BB-2052', 'SHELF-B-03', 'SHELF-B-03', -1, 'RETURN', 'MATCH', 'TXN-008'),
            ('SCAN-008', 'BB-2054', 'SHELF-C-01', 'SHELF-C-01', -2, 'ISSUE', 'MATCH', 'TXN-004'),
            ('SCAN-009', 'BB-2059', 'SHELF-C-04', 'SHELF-C-04', -4, 'ISSUE', 'MATCH', 'TXN-005'),
            ('SCAN-010', 'BB-2061', 'SHELF-A-08', 'SHELF-A-08', -3, 'ISSUE', 'MATCH', 'TXN-006'),
            ('SCAN-011', 'BB-2067', 'SHELF-A-10', 'SHELF-A-10', -6, 'ISSUE', 'MATCH', 'TXN-007'),
            ('SCAN-012', 'BB-2062', 'SHELF-B-06', 'SHELF-B-06', -4, 'RETURN', 'MATCH', 'TXN-010'),
        ]
        for (scan_id, copy_id, reg_loc, obs_loc, day_off, scan_type, vstatus, txn_id) in scan_data:
            if not ScanLog.query.get(scan_id):
                scan = ScanLog(
                    id=scan_id, copy_id=copy_id,
                    registered_location_id=reg_loc, observed_location_id=obs_loc,
                    scanned_at=days_from_now(day_off), scan_type=scan_type,
                    verification_status=vstatus, transaction_id=txn_id,
                )
                db.session.add(scan)
        db.session.flush()
        print('[OK] Scan logs seeded')

        # ── MISPLACED ALERTS ──────────────────────────────────────────────────
        import json as _json
        alert_data = [
            ('ALERT-001', 'BB-2055', 'SHELF-C-02', 'SHELF-B-07', -1, 'NEW', 'SIMULATED', '[]'),
            ('ALERT-002', 'BB-2065', 'SHELF-C-06', 'SHELF-A-08', -2, 'INVESTIGATING', 'SIMULATED',
             _json.dumps([{'at': days_from_now(-1).isoformat(), 'action': 'Marked under investigation', 'actor': 'Maya Thompson'}])),
        ]
        for (alert_id, copy_id, reg_loc, obs_loc, day_off, status, confidence, history) in alert_data:
            if not MisplacedAlert.query.get(alert_id):
                alert = MisplacedAlert(
                    id=alert_id, copy_id=copy_id,
                    registered_location_id=reg_loc, observed_location_id=obs_loc,
                    detected_at=days_from_now(day_off), status=status,
                    confidence=confidence, resolution_history=history,
                )
                db.session.add(alert)
        db.session.flush()
        print('[OK] Misplaced alerts seeded')

        # ── NOTIFICATIONS ─────────────────────────────────────────────────────
        note_data = [
            ('NOTE-001', 'USER-001', 'A book is due soon', 'Introduction to Algorithms is due in 6 days.', 'due', '/borrowed', False, 0),
            ('NOTE-002', 'USER-001', 'Overdue book', 'Database System Concepts is 3 days overdue. Please return it at the circulation desk.', 'overdue', '/due-fines', False, 0),
            ('NOTE-003', 'USER-001', 'Fine balance', 'A fine is accruing on an overdue loan.', 'fine', '/due-fines', True, -1),
            ('NOTE-004', 'USER-001', 'Return recorded', 'The Pragmatic Programmer was recorded as returned.', 'return', '/borrowed', True, -4),
            ('NOTE-005', 'USER-006', 'Possible location mismatch', 'A scan for Learning React differs from its registered shelf.', 'alert', '/librarian/misplaced', False, -1),
            ('NOTE-006', 'USER-006', 'New scan record', 'An inventory scan has been added for Cosmos.', 'scan', '/librarian/scans', False, -2),
            ('NOTE-007', 'USER-006', 'Overdue return needs attention', 'Three active loans are currently overdue.', 'overdue', '/librarian/circulation', False, 0),
        ]
        for (note_id, user_id, title, message, ntype, path, read, day_off) in note_data:
            if not Notification.query.get(note_id):
                note = Notification(
                    id=note_id, user_id=user_id, title=title, message=message,
                    type=ntype, path=path, read=read,
                    created_at=days_from_now(day_off),
                )
                db.session.add(note)
        db.session.flush()
        print('[OK] Notifications seeded')

        db.session.commit()
        print('\n[DONE] BookBeacon database seeded successfully!')
        print('\nDemo credentials (all accounts):')
        print('  Password: Beacon2026!')
        print('  Student:   student@bookbeacon.demo  (USER-001 / Alex Morgan)')
        print('  Librarian: librarian@bookbeacon.demo (USER-006 / Maya Thompson)')


if __name__ == '__main__':
    seed()
