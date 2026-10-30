import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="not-found"><span><Compass size={28} /></span><div className="eyebrow">404 · LOCATION NOT FOUND</div><h1>This page isn’t on the map.</h1><p>That address may have moved. Head back to BookBeacon and find your way from there.</p><Link to="/" className="button button--primary"><ArrowLeft size={16} />Return home</Link></main>;
}
