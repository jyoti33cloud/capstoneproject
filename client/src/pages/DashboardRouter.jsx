import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Home from './Home';
import TherapistDashboard from './dashboards/TherapistDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import OrgAdminDashboard from './dashboards/OrgAdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (user.role) {
    case 'parent':
      return <Home />;
    case 'therapist':
      return <TherapistDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'organization_admin':
      return <OrgAdminDashboard />;
    default:
      return <Home />;
  }
}
