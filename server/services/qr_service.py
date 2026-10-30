from datetime import datetime, timezone
from extensions import db
from models.book_copy import BookCopy
from models.scan_log import ScanLog
from models.misplaced_alert import MisplacedAlert
from services.borrowing_service import make_next_id


def lookup_copy(identifier: str):
    """Find a copy by its id or qr_code (case-insensitive, stripped)."""
    normalized = identifier.strip().upper()
    copy = BookCopy.query.filter(
        db.or_(
            db.func.upper(BookCopy.id) == normalized,
            db.func.upper(BookCopy.qr_code) == normalized,
        )
    ).first()
    return copy


def verify_scan(identifier: str, observed_location_id: str = None, scan_type: str = 'QR_SCAN'):
    """
    Look up a copy by identifier, record a scan log, and optionally detect a
    location mismatch.  A mismatch alert is only created when a trustworthy
    observed_location_id is supplied — future ESP32 scanners will provide this.
    """
    copy = lookup_copy(identifier)
    if not copy:
        return {'valid': False, 'message': 'No registered copy matches that Book ID or QR identifier.'}

    now = datetime.now(timezone.utc)
    mismatch = bool(observed_location_id and observed_location_id != copy.shelf_id)

    if mismatch:
        verification_status = 'SIMULATED_MISMATCH'
    elif observed_location_id:
        verification_status = 'MATCH'
    else:
        verification_status = 'IDENTIFIER_FOUND_NOT_PHYSICALLY_VERIFIED'

    scan = ScanLog(
        id=make_next_id(ScanLog, 'SCAN'),
        copy_id=copy.id,
        registered_location_id=copy.shelf_id,
        observed_location_id=observed_location_id or None,
        scanned_at=now,
        scan_type=scan_type,
        verification_status=verification_status,
    )
    copy.last_scanned_at = now
    db.session.add(scan)

    if mismatch:
        existing = MisplacedAlert.query.filter(
            MisplacedAlert.copy_id == copy.id,
            MisplacedAlert.status != 'RESOLVED',
        ).first()
        if not existing:
            alert = MisplacedAlert(
                id=make_next_id(MisplacedAlert, 'ALERT'),
                copy_id=copy.id,
                registered_location_id=copy.shelf_id,
                observed_location_id=observed_location_id,
                status='NEW',
                confidence='SIMULATED',
                resolution_history='[]',
            )
            db.session.add(alert)

    db.session.commit()

    msg = ('Simulated location mismatch. This is not an authoritative physical verification.'
           if mismatch
           else 'Copy identifier found. Physical shelf location has not been verified.'
           if not observed_location_id
           else 'Location verified successfully.')

    return {
        'valid': True,
        'copy': copy.to_dict(),
        'scan': scan.to_dict(),
        'mismatch': mismatch,
        'simulated': scan_type not in ('ISSUE', 'RETURN'),
        'message': msg,
    }
