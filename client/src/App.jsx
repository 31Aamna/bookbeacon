import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import { LoadingSpinner } from './components/common/States.jsx';
import PageLayout from './components/layout/PageLayout.jsx';
import PublicBrowseLayout from './components/layout/PublicBrowseLayout.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard.jsx'));
const SearchBooksPage = lazy(() => import('./pages/SearchBooksPage.jsx'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage.jsx'));
const MyBorrowedBooksPage = lazy(() => import('./pages/MyBorrowedBooksPage.jsx'));
const DueDatesFinesPage = lazy(() => import('./pages/DueDatesFinesPage.jsx'));
const LibraryMapPage = lazy(() => import('./pages/LibraryMapPage.jsx'));
const QRScannerPage = lazy(() => import('./pages/QRScannerPage.jsx'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage.jsx'));
const LibrarianDashboard = lazy(() => import('./pages/LibrarianDashboard.jsx'));
const ManageBooksPage = lazy(() => import('./pages/ManageBooksPage.jsx'));
const ManageCopiesPage = lazy(() => import('./pages/ManageCopiesPage.jsx'));
const ManageUsersPage = lazy(() => import('./pages/ManageUsersPage.jsx'));
const CirculationPage = lazy(() => import('./pages/CirculationPage.jsx'));
const InventoryAuditPage = lazy(() => import('./pages/InventoryAuditPage.jsx'));
const MisplacedBooksPage = lazy(() => import('./pages/MisplacedBooksPage.jsx'));
const ScanLogsPage = lazy(() => import('./pages/ScanLogsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner label="Restoring your BookBeacon session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'librarian' ? '/librarian/dashboard' : '/student/dashboard'} replace />;
  return <Outlet />;
}

function BrowseLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Loading BookBeacon…" />;
  return user ? <PageLayout /> : <PublicBrowseLayout />;
}

export default function App() {
  return <AppProvider><AuthProvider><BrowserRouter><Suspense fallback={<LoadingSpinner label="Opening this part of BookBeacon…" />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<BrowseLayout />}>
      <Route path="/books" element={<SearchBooksPage />} />
      <Route path="/books/:id" element={<BookDetailsPage />} />
      <Route path="/map" element={<LibraryMapPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<PageLayout />}>
        <Route path="/profile" element={<StudentProfilePage />} />
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/borrowed" element={<MyBorrowedBooksPage />} />
          <Route path="/due-fines" element={<DueDatesFinesPage />} />
          <Route path="/scan" element={<QRScannerPage />} />
        </Route>
        <Route element={<ProtectedRoute role="librarian" />}>
          <Route path="/librarian/dashboard" element={<LibrarianDashboard />} />
          <Route path="/librarian/books" element={<ManageBooksPage />} />
          <Route path="/librarian/copies" element={<ManageCopiesPage />} />
          <Route path="/librarian/users" element={<ManageUsersPage />} />
          <Route path="/librarian/circulation" element={<CirculationPage />} />
          <Route path="/librarian/inventory" element={<InventoryAuditPage />} />
          <Route path="/librarian/misplaced" element={<MisplacedBooksPage />} />
          <Route path="/librarian/scans" element={<ScanLogsPage />} />
          <Route path="/librarian/reports" element={<ReportsPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></BrowserRouter></AuthProvider></AppProvider>;
}
