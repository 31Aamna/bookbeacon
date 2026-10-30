export default function Zone({ zone, selected, onSelect, shelfCount }) {
  return <button className={`map-zone ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(zone.id)} aria-pressed={selected}><span className="map-zone__letter">{zone.code}</span><span className="map-zone__details"><strong>{zone.name}</strong><small>{zone.floor} · {zone.sections.length} sections</small></span><span className="map-zone__count">{shelfCount} shelves</span></button>;
}
