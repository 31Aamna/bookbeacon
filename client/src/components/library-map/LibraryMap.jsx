import { useEffect, useMemo, useState } from 'react';
import { BookOpen, DoorOpen, Search, Sofa } from 'lucide-react';
import { getLibraryMap, getShelves, formatLocationBreadcrumb } from '../../services/locationService.js';
import Zone from './Zone.jsx';
import Shelf from './Shelf.jsx';
import LocationLegend from './LocationLegend.jsx';

export default function LibraryMap({ selectedLocationId = null, selectedCopy = null, onSelectLocation, searchTerm = '', onSearchChange, compact = false }) {
  const [map, setMap] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [zoneId, setZoneId] = useState('ZONE-A');
  const [sectionId, setSectionId] = useState('SECTION-03');
  const [internalSearch, setInternalSearch] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([getLibraryMap(), getShelves()]).then(([library, shelfList]) => {
      if (!active) return;
      setMap(library);
      setShelves(shelfList || []);
    }).catch(() => { if (active) { setMap(null); setShelves([]); } });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const location = shelves.find((entry) => entry.id === (selectedLocationId || selectedCopy?.locationId));
    if (location) { setZoneId(location.zoneId); setSectionId(location.sectionId); }
  }, [selectedLocationId, selectedCopy?.locationId, shelves]);
  const query = searchTerm || internalSearch;
  const matching = useMemo(() => shelves.filter((shelf) => !query || `${shelf.shelfCode} ${shelf.sectionName} ${shelf.zoneName}`.toLowerCase().includes(query.toLowerCase())), [shelves, query]);
  const firstMatch = matching[0];
  useEffect(() => {
    if (!query.trim() || !firstMatch) return;
    setZoneId(firstMatch.zoneId);
    setSectionId(firstMatch.sectionId);
  }, [query, firstMatch]);
  const zone = map?.zones.find((entry) => entry.id === zoneId) || map?.zones[0];
  const section = zone?.sections.find((entry) => entry.id === sectionId) || zone?.sections[0];
  const destination = selectedLocationId || selectedCopy?.locationId || null;
  const clickShelf = (id) => { const located = shelves.find((entry) => entry.id === id); if (located) { setZoneId(located.zoneId); setSectionId(located.sectionId); } onSelectLocation?.(id); };
  if (!map) return <div className="map-empty">Library map data is unavailable.</div>;
  const activeSection = zone?.sections.find((entry) => entry.id === sectionId) || section;
  return <div className={`library-map ${compact ? 'library-map--compact' : ''}`}>
    <div className="map-toolbar"><div><span className="eyebrow">ENGINEERING LIBRARY</span><h2>Find your shelf</h2><p>Select a zone, then follow the shelf code in your location breadcrumb.</p></div><label className="map-search"><Search size={16} /><span className="sr-only">Search library locations</span><input value={query} onChange={(event) => onSearchChange ? onSearchChange(event.target.value) : setInternalSearch(event.target.value)} placeholder="Search a shelf or section" /></label></div>
    <div className="map-landmarks"><span><DoorOpen size={16} />Main entrance</span><span><BookOpen size={16} />Circulation desk</span><span><Sofa size={16} />Quiet reading room</span></div>
    <div className="map-layout"><div className="map-zone-list">{map.zones.map((item) => <Zone key={item.id} zone={item} selected={item.id === zone?.id} onSelect={(id) => { setZoneId(id); const selected = map.zones.find((entry) => entry.id === id); setSectionId(selected?.sections[0]?.id); }} shelfCount={item.sections.reduce((sum, sectionItem) => sum + sectionItem.shelves.length, 0)} />)}</div><div className="map-detail-panel"><div className="map-detail-panel__head"><div><span className="eyebrow">ZONE {zone?.code} · {zone?.floor}</span><h3>{zone?.name}</h3></div><span className="map-pulse"><i /> OPEN</span></div><div className="map-section-tabs" role="tablist" aria-label="Sections">{zone?.sections.map((item) => <button key={item.id} role="tab" aria-selected={item.id === activeSection?.id} className={item.id === activeSection?.id ? 'is-active' : ''} onClick={() => setSectionId(item.id)}>Section {item.code}</button>)}</div><p className="map-section-name">{activeSection?.name}</p><div className="map-shelf-grid">{matching.filter((item) => item.zoneId === zone?.id && item.sectionId === activeSection?.id).map((shelf) => <Shelf key={shelf.id} shelf={shelf} selected={shelf.id === selectedLocationId} destination={shelf.id === destination} onSelect={clickShelf} />)}{matching.filter((item) => item.zoneId === zone?.id && item.sectionId === activeSection?.id).length === 0 ? <p className="muted">No library locations match this search.</p> : null}</div><LocationLegend /></div></div>
    {destination && selectedCopy ? <div className="map-destination"><div className="map-destination__icon"><MapPinIcon /></div><div><span className="eyebrow">SELECTED COPY</span><strong>{selectedCopy.book?.title || selectedCopy.title || 'Selected book'} <span>· {selectedCopy.id}</span></strong><p>{formatLocationBreadcrumb(shelves.find((item) => item.id === destination))}</p><small>Demo shelf location based on registered catalogue data.</small></div></div> : destination ? <div className="map-breadcrumb"><span className="eyebrow">LOCATION BREADCRUMB</span><strong>{formatLocationBreadcrumb(shelves.find((item) => item.id === destination))}</strong></div> : <div className="map-breadcrumb"><span className="eyebrow">HOW TO USE</span><strong>Choose a shelf to see its location, or open a book and select “Find on map”.</strong></div>}
  </div>;
}

function MapPinIcon() { return <span className="map-pin-glyph">⌖</span>; }
