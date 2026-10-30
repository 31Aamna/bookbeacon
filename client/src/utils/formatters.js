export function getInitials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'BB';
}

export function titleCase(value = '') {
  return String(value).toLowerCase().replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function toCsv(rows, columns) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const header = columns.map((column) => escape(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => escape(typeof column.value === 'function' ? column.value(row) : row[column.key])).join(','));
  return [header, ...body].join('\r\n');
}

export function downloadCsv(filename, rows, columns) {
  const csv = toCsv(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
