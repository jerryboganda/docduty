import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import DoctorLayout from './components/doctor/DoctorLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { getHostSurface, getRolePath, getRoleSurface, getSurfaceOrigin, shouldUseDedicatedHosts } from './lib/runtimeHost';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import AttendanceDetails from './pages/AttendanceDetails';
import BookingDetails from './pages/BookingDetails';
import Bookings from './pages/Bookings';
import Dashboard from './pages/Dashboard';
import DisputeDetails from './pages/DisputeDetails';
import Disputes from './pages/Disputes';
import Login from './pages/Login';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import PostShift from './pages/PostShift';
import Ratings from './pages/Ratings';
import Settings from './pages/Settings';
import ShiftDetails from './pages/ShiftDetails';
import Shifts from './pages/Shifts';
import AdminAnalytics from './pages/admin/Analytics';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDisputes from './pages/admin/Disputes';
import AdminFacilities from './pages/admin/Facilities';
import AdminNotifications from './pages/admin/Notifications';
import AdminPayments from './pages/admin/Payments';
import AdminPolicies from './pages/admin/Policies';
import AdminSettings from './pages/admin/Settings';
import AdminUsers from './pages/admin/Users';
import VerificationQueue from './pages/admin/VerificationQueue';
import DoctorAttendance from './pages/doctor/Attendance';
import DoctorBookingDetails from './pages/doctor/BookingDetails';
import DoctorBookings from './pages/doctor/Bookings';
import DoctorDisputeDetails from './pages/doctor/DisputeDetails';
import DoctorDisputes from './pages/doctor/Disputes';
import DoctorHome from './pages/doctor/Home';
import DoctorMessages from './pages/doctor/Messages';
import DoctorNotifications from './pages/doctor/Notifications';
import DoctorProfile from './pages/doctor/Profile';
import DoctorSettings from './pages/doctor/Settings';
import DoctorShiftDetails from './pages/doctor/ShiftDetails';
import DoctorWallet from './pages/doctor/Wallet';

function ExternalRedirect({ href }: { href: string }) {
  React.useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return null;
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const portalRoutes: Record<string, string> = {
      doctor: '/doctor',
      facility_admin: '/facility',
      platform_admin: '/admin',
    };

    return <Navigate to={portalRoutes[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}

function LoginRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hostSurface = getHostSurface();
  const useDedicatedHosts = shouldUseDedicatedHosts();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    const targetSurface = getRoleSurface(user.role);
    const targetPath = getRolePath(user.role);
    if (useDedicatedHosts && hostSurface !== 'generic' && hostSurface !== targetSurface) {
      return <ExternalRedirect href={`${getSurfaceOrigin(targetSurface)}${targetPath}`} />;
    }

    return <Navigate to={targetPath} replace />;
  }

  return <Login />;
}

function AppRoutes() {
  const hostSurface = getHostSurface();
  const useDedicatedHosts = shouldUseDedicatedHosts();
  const adminOrigin = getSurfaceOrigin('admin');
  const portalOrigin = getSurfaceOrigin('portal');

  return (
    <Routes>
      <Route
        path="/"
        element={
          hostSurface === 'admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/facility"
        element={
          useDedicatedHosts && hostSurface === 'admin'
            ? <ExternalRedirect href={`${portalOrigin}/facility`} />
            : (
              <ProtectedRoute allowedRoles={['facility_admin']}>
                <Layout />
              </ProtectedRoute>
            )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="post" element={<PostShift />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="shifts/:id" element={<ShiftDetails />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance/:id" element={<AttendanceDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="disputes/:id" element={<DisputeDetails />} />
        <Route path="messages" element={<Messages />} />
        <Route path="ratings" element={<Ratings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/doctor"
        element={
          useDedicatedHosts && hostSurface === 'admin'
            ? <ExternalRedirect href={`${portalOrigin}/doctor`} />
            : (
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorLayout />
              </ProtectedRoute>
            )
        }
      >
        <Route index element={<DoctorHome />} />
        <Route path="shifts/:id" element={<DoctorShiftDetails />} />
        <Route path="bookings" element={<DoctorBookings />} />
        <Route path="bookings/:id" element={<DoctorBookingDetails />} />
        <Route path="attendance" element={<DoctorAttendance />} />
        <Route path="wallet" element={<DoctorWallet />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="settings" element={<DoctorSettings />} />
        <Route path="disputes" element={<DoctorDisputes />} />
        <Route path="disputes/:id" element={<DoctorDisputeDetails />} />
        <Route path="messages" element={<DoctorMessages />} />
        <Route path="notifications" element={<DoctorNotifications />} />
        <Route path="search" element={<Navigate to="/doctor" replace />} />
      </Route>

      <Route
        path="/admin"
        element={
          useDedicatedHosts && hostSurface === 'portal'
            ? <ExternalRedirect href={`${adminOrigin}/admin`} />
            : (
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            )
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="verifications" element={<VerificationQueue />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="facilities" element={<AdminFacilities />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="policies" element={<AdminPolicies />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="audit" element={<AdminAuditLogs />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="*"
        element={
          hostSurface === 'admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
