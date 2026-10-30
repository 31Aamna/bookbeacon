export const libraryMap = {
  id: 'LIB-001',
  name: 'Engineering Library',
  entrance: { label: 'Main entrance', zone: 'ZONE-A' },
  readingArea: { label: 'Quiet reading room', zone: 'ZONE-C' },
  circulationDesk: { label: 'Circulation desk', zone: 'ZONE-A' },
  zones: [
    { id: 'ZONE-A', code: 'A', name: 'Technology Commons', floor: 'Level 1', sections: [
      { id: 'SECTION-01', code: '01', name: 'Computing foundations', shelves: [{ id: 'SHELF-A-05', shelfCode: 'A-05', displayName: 'Shelf A-05' }] },
      { id: 'SECTION-02', code: '02', name: 'Software practice', shelves: [{ id: 'SHELF-A-06', shelfCode: 'A-06', displayName: 'Shelf A-06' }, { id: 'SHELF-A-07', shelfCode: 'A-07', displayName: 'Shelf A-07' }] },
      { id: 'SECTION-03', code: '03', name: 'Algorithms & systems', shelves: [{ id: 'SHELF-A-04', shelfCode: 'A-04', displayName: 'Shelf A-04' }, { id: 'SHELF-A-08', shelfCode: 'A-08', displayName: 'Shelf A-08' }, { id: 'SHELF-A-09', shelfCode: 'A-09', displayName: 'Shelf A-09' }, { id: 'SHELF-A-10', shelfCode: 'A-10', displayName: 'Shelf A-10' }] },
    ] },
    { id: 'ZONE-B', code: 'B', name: 'Research & Data', floor: 'Level 2', sections: [
      { id: 'SECTION-04', code: '04', name: 'Data & databases', shelves: [{ id: 'SHELF-B-01', shelfCode: 'B-01', displayName: 'Shelf B-01' }, { id: 'SHELF-B-02', shelfCode: 'B-02', displayName: 'Shelf B-02' }] },
      { id: 'SECTION-05', code: '05', name: 'Mathematical sciences', shelves: [{ id: 'SHELF-B-03', shelfCode: 'B-03', displayName: 'Shelf B-03' }, { id: 'SHELF-B-04', shelfCode: 'B-04', displayName: 'Shelf B-04' }, { id: 'SHELF-B-05', shelfCode: 'B-05', displayName: 'Shelf B-05' }] },
      { id: 'SECTION-06', code: '06', name: 'Interdisciplinary study', shelves: [{ id: 'SHELF-B-06', shelfCode: 'B-06', displayName: 'Shelf B-06' }, { id: 'SHELF-B-07', shelfCode: 'B-07', displayName: 'Shelf B-07' }] },
    ] },
    { id: 'ZONE-C', code: 'C', name: 'Humanities & Science', floor: 'Level 3', sections: [
      { id: 'SECTION-07', code: '07', name: 'Literature', shelves: [{ id: 'SHELF-C-01', shelfCode: 'C-01', displayName: 'Shelf C-01' }, { id: 'SHELF-C-02', shelfCode: 'C-02', displayName: 'Shelf C-02' }] },
      { id: 'SECTION-08', code: '08', name: 'Life and physical sciences', shelves: [{ id: 'SHELF-C-03', shelfCode: 'C-03', displayName: 'Shelf C-03' }, { id: 'SHELF-C-04', shelfCode: 'C-04', displayName: 'Shelf C-04' }] },
      { id: 'SECTION-09', code: '09', name: 'General collection', shelves: [{ id: 'SHELF-C-05', shelfCode: 'C-05', displayName: 'Shelf C-05' }, { id: 'SHELF-C-06', shelfCode: 'C-06', displayName: 'Shelf C-06' }] },
    ] },
  ],
};

export const locations = libraryMap.zones.flatMap((zone) => zone.sections.flatMap((section) => section.shelves.map((shelf) => ({
  ...shelf,
  libraryId: libraryMap.id,
  libraryName: libraryMap.name,
  zoneId: zone.id,
  zoneCode: zone.code,
  zoneName: zone.name,
  floor: zone.floor,
  sectionId: section.id,
  sectionCode: section.code,
  sectionName: section.name,
}))));
