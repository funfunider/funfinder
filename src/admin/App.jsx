import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import LoadingSpinner from './components/LoadingSpinner';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';

// Lazy loaded admin page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const Events = lazy(() => import('./pages/Events'));
const Cities = lazy(() => import('./pages/Cities'));
const Countries = lazy(() => import('./pages/Countries'));
const Categories = lazy(() => import('./pages/Categories'));
const Companies = lazy(() => import('./pages/Companies'));
const Users = lazy(() => import('./pages/Users'));
const Orders = lazy(() => import('./pages/Orders'));
const Reviews = lazy(() => import('./pages/Reviews'));
const QRScanner = lazy(() => import('./pages/QRScanner'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const InsufficientPermissions = lazy(() => import('./pages/InsufficientPermissions'));
const Slider = lazy(() => import('./components/Slider'));

export function AdminPortal({ initialView }) {
  const { isAuthenticated, isAdmin, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Initializing Portal..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin && !isStaff) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <>
      <SessionManager />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc', color: '#1e293b' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - 264px)` },
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            mt: { xs: '60px', md: '68px' },
          }}
        >
          <Suspense fallback={<LoadingSpinner message="Loading..." />}>
            <Routes>
              {/* If accessed via /staff, default to StaffDashboard */}
              <Route
                path="/"
                element={
                  initialView === 'staff'
                    ? <StaffDashboard />
                    : (isAdmin ? <Dashboard /> : <Navigate to="/staff" replace />)
                }
              />
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <Navigate to="/staff" replace />} />

              {/* Shared operations accessible to both Admin and Staff */}
              <Route path="/events" element={<ErrorBoundary><Events /></ErrorBoundary>} />
              <Route path="/orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
              <Route path="/reviews" element={<ErrorBoundary><Reviews /></ErrorBoundary>} />
              <Route path="/qr-scanner" element={<ErrorBoundary><QRScanner /></ErrorBoundary>} />

              {/* Admin-only system catalog & management */}
              <Route path="/cities" element={<AdminRoute><ErrorBoundary><Cities /></ErrorBoundary></AdminRoute>} />
              <Route path="/countries" element={<AdminRoute><ErrorBoundary><Countries /></ErrorBoundary></AdminRoute>} />
              <Route path="/categories" element={<AdminRoute><ErrorBoundary><Categories /></ErrorBoundary></AdminRoute>} />
              <Route path="/companies" element={<AdminRoute><ErrorBoundary><Companies /></ErrorBoundary></AdminRoute>} />
              <Route path="/users" element={<AdminRoute><ErrorBoundary><Users /></ErrorBoundary></AdminRoute>} />
              <Route path="/slider" element={<AdminRoute><ErrorBoundary><Slider /></ErrorBoundary></AdminRoute>} />

              {/* Access control pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/insufficient-permissions" element={<InsufficientPermissions />} />

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to={initialView === 'staff' || !isAdmin ? '/staff' : '/admin'} replace />}
              />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </>
  );
}

export default AdminPortal;
