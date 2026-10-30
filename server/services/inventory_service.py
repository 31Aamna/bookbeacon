from datetime import datetime, timezone
from extensions import db
from models.book_copy import BookCopy
from models.misplaced_alert import MisplacedAlert
from models.inventory_audit import InventoryAudit
from models.scan_log import ScanLog
from services.borrowing_service import make_next_id


def get_inventory():
    """Return all non-retired copies enriched with book, location, and recent scans."""
    copies = BookCopy.query.filter(BookCopy.status != 'RETIRED').all()
    result = []
    for copy in copies:
        data = copy.to_dict()
        data['book'] = copy.book.to_dict() if copy.book else None
        recent_scans = (
            ScanLog.query
            .filter_by(copy_id=copy.id)
            .order_by(ScanLog.scanned_at.desc())
            .limit(10)
            .all()
        )
        data['scanLogs'] = [s.to_dict() for s in recent_scans]
        result.append(data)
    return result


def get_misplaced_books():
    return [
        a.to_dict()
        for a in MisplacedAlert.query.order_by(MisplacedAlert.detected_at.desc()).all()
    ]


def update_alert_status(alert_id: str, status: str, actor_name: str = 'Librarian'):
    alert = MisplacedAlert.query.get(alert_id)
    if not alert:
        raise ValueError('That location alert could not be found.')
    if alert.status == 'RESOLVED':
        raise ValueError('Resolved alerts are read-only; create a new scan to open another review.')
    if status == 'RESOLVED':
        raise ValueError('Use the shelf-verification workflow to resolve a location alert.')
    if status not in ('NEW', 'INVESTIGATING'):
        raise ValueError('Choose a valid alert status.')
    alert.status = status
    if status == 'INVESTIGATING':
        alert.add_resolution_event('Marked under investigation', actor_name)
    db.session.commit()
    return alert.to_dict()


def verify_alert(alert_id: str, verified_location_id: str, actor_name: str = 'Librarian'):
    alert = MisplacedAlert.query.get(alert_id)
    if not alert:
        raise ValueError('That location alert could not be found.')
    if alert.status == 'RESOLVED':
        raise ValueError('Resolved alerts are read-only.')
    if verified_location_id == alert.registered_location_id:
        alert.status = 'RESOLVED'
        alert.add_resolution_event('Verification matched registered shelf; alert resolved.', actor_name)
    else:
        alert.status = 'INVESTIGATING'
        alert.confidence = 'SIMULATED_MISMATCH'
        alert.add_resolution_event('Verification still differs from registered shelf.', actor_name)
    db.session.commit()
    return alert.to_dict()


def run_audit(actor_name: str = 'Librarian'):
    copy_count = BookCopy.query.filter(BookCopy.status != 'RETIRED').count()
    alerts_found = MisplacedAlert.query.filter(MisplacedAlert.status != 'RESOLVED').count()
    audit = InventoryAudit(
        id=make_next_id(InventoryAudit, 'AUDIT'),
        copy_count=copy_count,
        alerts_found=alerts_found,
        mode='MANUAL',
        note='Audit summarizes current database records; no physical shelf scan was performed.',
        completed_at=datetime.now(timezone.utc),
    )
    db.session.add(audit)
    db.session.commit()
    return audit.to_dict()


def get_audit_history():
    return [a.to_dict() for a in InventoryAudit.query.order_by(InventoryAudit.started_at.desc()).all()]
