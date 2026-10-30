import { useEffect, useState } from 'react';
import { ArrowLeft, MapPinned } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getInventory } from '../services/inventoryService.js';
import LibraryMap from '../components/library-map/LibraryMap.jsx';
import Button from '../components/common/Button.jsx';
import { PageHeading } from '../components/common/States.jsx';

export default function LibraryMapPage() {
  const location = useLocation(); const navigate = useNavigate();
  const initialCopy = location.state?.copy || null;
  const [selectedCopy, setSelectedCopy] = useState(initialCopy);
  const [selectedLocationId, setSelectedLocationId] = useState(initialCopy?.locationId || null);
  const [shelves, setShelves] = useState([]);
  useEffect(() => { let active = true; getInventory().then((items) => { if (active) setShelves(items); }).catch(() => { if (active) setShelves([]); }); return () => { active = false; }; }, []);
  const backTo = location.state?.from || '/books';
  const backLabel = backTo === '/student/dashboard' ? 'Back to dashboard' : backTo === '/librarian/misplaced' ? 'Back to alerts' : 'Back to search';
  const selectLocation = (locationId) => {
    setSelectedLocationId(locationId);
    const matching = shelves.find((copy) => copy.locationId === locationId && copy.status === 'AVAILABLE');
    if (matching) setSelectedCopy(matching);
    else if (selectedCopy?.locationId !== locationId) setSelectedCopy(null);
  };
  return <div className="map-page"><div className="map-page__back"><Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(backTo)}>{backLabel}</Button><span><MapPinned size={14} /> INTERACTIVE LOCATION GUIDE</span></div><PageHeading eyebrow="ENGINEERING LIBRARY · WAYFINDING" title="Find the shelf, not just the book." description="Choose a zone, narrow to a section, and select a shelf. The breadcrumb keeps the destination clear at every step." action={<Link to="/books" className="text-link">Search books instead →</Link>} /><section className="panel-card map-page__panel"><LibraryMap selectedCopy={selectedCopy} selectedLocationId={selectedLocationId} onSelectLocation={selectLocation} /></section><div className="map-page__note"><span className="map-note-dot" /><p>Map locations represent registered demonstration data. A shelf highlight is a guide to the recorded location—not a live physical verification.</p></div></div>;
}
