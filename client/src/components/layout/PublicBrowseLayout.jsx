import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, MapPinned, Search } from 'lucide-react';
import { BrandMark } from './Sidebar.jsx';

export default function PublicBrowseLayout() {
  return <div className="public-browse"><header className="public-browse__header"><Link to="/" className="landing-brand"><BrandMark /><span><strong>BookBeacon</strong><small>SMART LIBRARY</small></span></Link><nav><Link to="/books"><Search size={15} />Catalogue</Link><Link to="/map"><MapPinned size={15} />Library map</Link></nav><Link to="/login" className="public-browse__login">Sign in <ArrowLeft size={14} className="flip-x" /></Link></header><main><Outlet /></main><footer className="public-browse__footer"><span>Catalogue exploration is open. Borrowing records and demo workflows require sign in.</span><Link to="/register">Create a demo account →</Link></footer></div>;
}
