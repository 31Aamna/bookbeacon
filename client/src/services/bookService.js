import { apiRequest, isApiMode } from './apiClient.js';
import { getMockData, updateMockData, makeId } from './mockStore.js';
import { normalizeIdentifier, validateBookForm } from '../utils/validation.js';

function attachCopyCounts(book, data) {
  const copies = data.copies.filter((copy) => copy.bookId === book.id).map((copy) => ({ ...copy, location: data.locations.find((location) => location.id === copy.locationId) || null }));
  const activeCopies = copies.filter((copy) => copy.status !== 'RETIRED');
  return { ...book, copies, availableCopies: activeCopies.filter((copy) => copy.status === 'AVAILABLE').length, totalCopies: activeCopies.length };
}

export async function getBooks() {
  if (isApiMode()) return apiRequest('/books');
  const data = getMockData();
  return data.books.filter((book) => !book.archivedAt).map((book) => attachCopyCounts(book, data));
}

export async function searchBooks(query = '') {
  if (isApiMode()) return apiRequest(`/books?q=${encodeURIComponent(query)}`);
  const needle = String(query).trim().toLowerCase();
  const data = getMockData();
  return data.books.filter((book) => !book.archivedAt && (!needle || [book.title, book.isbn, book.category, book.id, book.publisher, ...book.authors].join(' ').toLowerCase().includes(needle))).map((book) => attachCopyCounts(book, data));
}

export async function getBookById(id) {
  if (isApiMode()) return apiRequest(`/books/${encodeURIComponent(id)}`);
  const data = getMockData();
  const book = data.books.find((entry) => entry.id === id && !entry.archivedAt);
  return book ? attachCopyCounts(book, data) : null;
}

export async function getBookCopies(bookId) {
  if (isApiMode()) return apiRequest(`/copies?bookId=${encodeURIComponent(bookId)}`);
  const data = getMockData();
  return data.copies.filter((copy) => copy.bookId === bookId).map((copy) => ({ ...copy, location: data.locations.find((location) => location.id === copy.locationId) || null }));
}

export async function createBook(values) {
  if (isApiMode()) return apiRequest('/books', { method: 'POST', body: values });
  const errors = validateBookForm(values);
  if (Object.keys(errors).length) { const error = new Error('Please correct the highlighted book fields.'); error.fieldErrors = errors; throw error; }
  return updateMockData((data) => {
    const id = makeId('BOOK', data.books);
    const book = { ...values, id, title: values.title.trim(), authors: Array.isArray(values.authors) ? values.authors : String(values.author || '').split(',').map((item) => item.trim()).filter(Boolean), publicationYear: values.publicationYear ? Number(values.publicationYear) : null, createdAt: new Date().toISOString() };
    delete book.author;
    data.books.unshift(book);
    return book;
  });
}

export async function updateBook(id, values) {
  if (isApiMode()) return apiRequest(`/books/${encodeURIComponent(id)}`, { method: 'PATCH', body: values });
  return updateMockData((data) => {
    const book = data.books.find((entry) => entry.id === id && !entry.archivedAt);
    if (!book) throw new Error('That title could not be found. Refresh the catalogue and try again.');
    const errors = validateBookForm({ ...book, ...values });
    if (Object.keys(errors).length) { const error = new Error('Please correct the highlighted book fields.'); error.fieldErrors = errors; throw error; }
    Object.assign(book, values, values.author ? { authors: String(values.author).split(',').map((item) => item.trim()).filter(Boolean) } : {});
    if (values.publicationYear !== undefined) book.publicationYear = values.publicationYear ? Number(values.publicationYear) : null;
    return book;
  });
}

export async function deleteBook(id) {
  if (isApiMode()) return apiRequest(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return updateMockData((data) => {
    const book = data.books.find((entry) => entry.id === id && !entry.archivedAt);
    if (!book) throw new Error('That title could not be found. Refresh the catalogue and try again.');
    const copyIds = new Set(data.copies.filter((copy) => copy.bookId === id).map((copy) => copy.id));
    if (data.transactions.some((transaction) => copyIds.has(transaction.copyId) && transaction.status === 'ISSUED')) throw new Error('This title has an active borrowing transaction and cannot be deleted yet.');
    const historicalCopyIds = new Set(data.transactions.filter((transaction) => copyIds.has(transaction.copyId)).map((transaction) => transaction.copyId));
    data.copies = data.copies.filter((copy) => { if (copy.bookId !== id) return true; if (historicalCopyIds.has(copy.id)) { copy.status = 'RETIRED'; return true; } return false; });
    book.archivedAt = new Date().toISOString();
    return true;
  });
}

export async function createCopy(values) {
  if (isApiMode()) return apiRequest('/copies', { method: 'POST', body: values });
  return updateMockData((data) => {
    const id = normalizeIdentifier(values.id);
    if (!id) throw new Error('Enter a unique Book ID for this physical copy.');
    if (data.copies.some((copy) => normalizeIdentifier(copy.id) === id || normalizeIdentifier(copy.qrCode) === id)) throw new Error('That Book ID or QR identifier already exists. Choose another identifier.');
    if (!data.books.some((book) => book.id === values.bookId && !book.archivedAt)) throw new Error('Select a valid active catalogue title.');
    if (!data.locations.some((location) => location.id === values.locationId)) throw new Error('Select a registered shelf location.');
    const status = values.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE';
    const copy = { id, bookId: values.bookId, qrCode: id, status, locationId: values.locationId, lastScannedAt: null };
    data.copies.push(copy);
    return copy;
  });
}

export async function updateCopy(id, values) {
  if (isApiMode()) return apiRequest(`/copies/${encodeURIComponent(id)}`, { method: 'PATCH', body: values });
  return updateMockData((data) => {
    const copy = data.copies.find((entry) => entry.id === id);
    if (!copy) throw new Error('That physical copy could not be found.');
    if (copy.status === 'RETIRED') throw new Error('This copy is retained only for historical records and cannot be edited.');
    if (values.id && normalizeIdentifier(values.id) !== normalizeIdentifier(id) && data.copies.some((entry) => normalizeIdentifier(entry.id) === normalizeIdentifier(values.id) || normalizeIdentifier(entry.qrCode) === normalizeIdentifier(values.id))) throw new Error('That Book ID or QR identifier already exists.');
    if (values.locationId && !data.locations.some((location) => location.id === values.locationId)) throw new Error('Select a registered shelf location.');
    const hasActiveLoan = data.transactions.some((transaction) => transaction.copyId === id && transaction.status === 'ISSUED');
    if (hasActiveLoan && values.status && values.status !== 'ISSUED') throw new Error('An issued copy’s status can only be changed by recording its return.');
    if (!hasActiveLoan && values.status === 'ISSUED') throw new Error('Use the circulation workflow to issue a copy.');
    if (values.status && !['AVAILABLE', 'ISSUED', 'MAINTENANCE'].includes(values.status)) throw new Error('Choose an allowed copy status.');
    Object.assign(copy, values);
    return copy;
  });
}
