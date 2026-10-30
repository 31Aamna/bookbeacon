import { MapPin } from 'lucide-react';

export default function Shelf({ shelf, selected, destination, onSelect }) {
  return <button className={`map-shelf ${selected ? 'is-selected' : ''} ${destination ? 'is-destination' : ''}`} onClick={() => onSelect(shelf.id)} aria-pressed={selected} aria-label={`Select shelf ${shelf.shelfCode}${destination ? ', selected destination' : ''}`}><span className="map-shelf__icon"><MapPin size={14} /></span><span><strong>{shelf.shelfCode}</strong><small>{shelf.displayName}</small></span>{destination ? <span className="map-shelf__tag">DESTINATION</span> : null}</button>;
}
