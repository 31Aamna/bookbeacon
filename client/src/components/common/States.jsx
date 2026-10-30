import { AlertCircle, BookOpen, LoaderCircle } from 'lucide-react';
import Button from './Button.jsx';

export function LoadingSpinner({ label = 'Loading', compact = false }) {
  return <div className={`loading-state ${compact ? 'loading-state--compact' : ''}`} role="status"><LoaderCircle className="spin" size={compact ? 18 : 24} /><span>{label}</span></div>;
}

export function EmptyState({ title = 'Nothing here yet', description, action, icon: Icon = BookOpen }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon size={22} /></span><h3>{title}</h3>{description ? <p>{description}</p> : null}{action ? <Button variant="secondary" onClick={action.onClick}>{action.label}</Button> : null}</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="error-state" role="alert"><AlertCircle size={19} /><div><strong>We couldn’t load this information.</strong><p>{message}</p>{onRetry ? <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button> : null}</div></div>;
}

export function PageHeading({ eyebrow, title, description, action, className = '' }) {
  return <div className={`page-heading ${className}`}><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action ? <div className="page-heading__action">{action}</div> : null}</div>;
}

export function SearchBar({ value, onChange, placeholder = 'Search', label = 'Search', className = '', onSubmit, autoFocus = false }) {
  return <form className={`search-field ${className}`} role="search" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}><label className="sr-only" htmlFor="search-input">{label}</label><span aria-hidden="true">⌕</span><input id="search-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoFocus={autoFocus} /><button type="submit" aria-label={label}>Search</button></form>;
}
