export function isEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function validatePassword(value = '') {
  return String(value).length >= 8;
}

export function normalizeIdentifier(value = '') {
  return String(value).trim().toUpperCase();
}

export function validateBookForm(values) {
  const errors = {};
  if (!isRequired(values.title)) errors.title = 'Enter a book title.';
  if (!isRequired(values.author)) errors.author = 'Enter at least one author.';
  if (!isRequired(values.isbn)) errors.isbn = 'Enter an ISBN.';
  if (!isRequired(values.category)) errors.category = 'Choose a category.';
  if (values.publicationYear && (Number(values.publicationYear) < 1000 || Number(values.publicationYear) > new Date().getFullYear() + 1)) errors.publicationYear = 'Enter a valid publication year.';
  return errors;
}
