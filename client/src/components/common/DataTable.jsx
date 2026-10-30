import { EmptyState } from './States.jsx';

export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, emptyTitle = 'No records found', emptyDescription = 'Try adjusting your filters.' }) {
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <div className="table-wrap"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[rowKey] || index} className={onRowClick ? 'is-clickable' : ''} onClick={() => onRowClick?.(row)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}

export function SelectField({ label, value, onChange, options, id, className = '' }) {
  const fieldId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <label className={`field ${className}`} htmlFor={fieldId}><span>{label}</span><select id={fieldId} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
