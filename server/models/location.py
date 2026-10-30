from extensions import db
from datetime import datetime, timezone


class Library(db.Model):
    __tablename__ = 'libraries'

    id = db.Column(db.String(32), primary_key=True)     # e.g. LIB-001
    name = db.Column(db.String(200), nullable=False)
    entrance_label = db.Column(db.String(200), nullable=True)
    entrance_zone_id = db.Column(db.String(32), nullable=True)
    reading_area_label = db.Column(db.String(200), nullable=True)
    circulation_desk_label = db.Column(db.String(200), nullable=True)

    zones = db.relationship('Zone', back_populates='library', lazy='select', order_by='Zone.code')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'entrance': {'label': self.entrance_label, 'zone': self.entrance_zone_id},
            'readingArea': {'label': self.reading_area_label},
            'circulationDesk': {'label': self.circulation_desk_label},
            'zones': [z.to_dict() for z in self.zones],
        }


class Zone(db.Model):
    __tablename__ = 'zones'

    id = db.Column(db.String(32), primary_key=True)     # e.g. ZONE-A
    library_id = db.Column(db.String(32), db.ForeignKey('libraries.id'), nullable=False, index=True)
    code = db.Column(db.String(8), nullable=False)       # A, B, C
    name = db.Column(db.String(200), nullable=False)
    floor = db.Column(db.String(64), nullable=True)

    library = db.relationship('Library', back_populates='zones')
    sections = db.relationship('Section', back_populates='zone', lazy='select', order_by='Section.code')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'floor': self.floor,
            'sections': [s.to_dict() for s in self.sections],
        }


class Section(db.Model):
    __tablename__ = 'sections'

    id = db.Column(db.String(32), primary_key=True)     # e.g. SECTION-01
    zone_id = db.Column(db.String(32), db.ForeignKey('zones.id'), nullable=False, index=True)
    code = db.Column(db.String(8), nullable=False)       # 01, 02, …
    name = db.Column(db.String(200), nullable=False)

    zone = db.relationship('Zone', back_populates='sections')
    shelves = db.relationship('Shelf', back_populates='section', lazy='select', order_by='Shelf.shelf_code')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'shelves': [sh.to_dict(short=True) for sh in self.shelves],
        }


class Shelf(db.Model):
    __tablename__ = 'shelves'

    id = db.Column(db.String(32), primary_key=True)     # e.g. SHELF-A-04
    section_id = db.Column(db.String(32), db.ForeignKey('sections.id'), nullable=False, index=True)
    shelf_code = db.Column(db.String(16), nullable=False)  # A-04
    display_name = db.Column(db.String(64), nullable=True)

    section = db.relationship('Section', back_populates='shelves')
    copies = db.relationship('BookCopy', back_populates='shelf', lazy='dynamic')

    def to_dict(self, short=False):
        if short:
            return {'id': self.id, 'shelfCode': self.shelf_code, 'displayName': self.display_name}
        # Full flat representation matching frontend "locations" shape
        sec = self.section
        zone = sec.zone if sec else None
        lib = zone.library if zone else None
        return {
            'id': self.id,
            'shelfCode': self.shelf_code,
            'displayName': self.display_name,
            'sectionId': sec.id if sec else None,
            'sectionCode': sec.code if sec else None,
            'sectionName': sec.name if sec else None,
            'zoneId': zone.id if zone else None,
            'zoneCode': zone.code if zone else None,
            'zoneName': zone.name if zone else None,
            'floor': zone.floor if zone else None,
            'libraryId': lib.id if lib else None,
            'libraryName': lib.name if lib else None,
        }

    def __repr__(self):
        return f'<Shelf {self.id}>'
