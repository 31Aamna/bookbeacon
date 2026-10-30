import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SummaryCard({ label, value, detail, icon: Icon, tone = 'teal', to, actionLabel }) {
  return <article className={`summary-card summary-card--${tone}`}><div className="summary-card__top"><span className="summary-card__icon"><Icon size={19} /></span>{to ? <Link to={to} className="summary-card__link" aria-label={actionLabel || `View ${label}`}><ArrowUpRight size={17} /></Link> : null}</div><div className="summary-card__value">{value}</div><div className="summary-card__label">{label}</div>{detail ? <p>{detail}</p> : null}</article>;
}
