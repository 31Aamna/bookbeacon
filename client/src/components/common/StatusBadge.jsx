import { titleCase } from '../../utils/formatters.js';

const STATUS_CLASS = {
  available: 'success', returned: 'success', match: 'success', resolved: 'success', paid: 'success',
  issued: 'info', borrowed: 'info', 'identifier found not physically verified': 'info',
  'due-soon': 'warning', 'due soon': 'warning', investigating: 'warning', new: 'danger', overdue: 'danger',
  misplaced: 'danger', maintenance: 'muted', unavailable: 'muted', 'simulated mismatch': 'danger',
  simulated: 'warning', 'potential mismatch': 'warning', unpaid: 'warning',
};

export default function StatusBadge({ status, label, className = '' }) {
  const text = label || titleCase(status || 'Unknown');
  const kind = STATUS_CLASS[String(status || '').toLowerCase()] || STATUS_CLASS[text.toLowerCase()] || 'muted';
  return <span className={`status-badge status-badge--${kind} ${className}`.trim()}>{text}</span>;
}
