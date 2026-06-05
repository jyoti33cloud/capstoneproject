import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useLang } from '../context/LangContext';

export default function AdminDashboard() {
  const { getDashboardStats, loading } = useAdmin();
  const { t } = useLang();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await getDashboardStats();
    if (data) setStats(data);
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-100/60 p-4 flex items-center justify-center">
        <div className="text-slate-600">{loading ? 'Loading...' : 'Failed to load stats'}</div>
      </div>
    );
  }

  const StatCard = ({ title, value, color, action, actionText }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-card border-l-4 ${color}`}>
      <div className="text-sm font-medium text-slate-600 mb-2">{title}</div>
      <div className="text-3xl font-bold text-slate-900 mb-4">{value}</div>
      {action && (
        <Link to={action} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {actionText} →
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">Manage users, therapists, and content</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          color="border-blue-500"
        />
        <StatCard
          title="Verified Therapists"
          value={stats.totalTherapists}
          color="border-green-500"
        />
        <StatCard
          title="Pending Therapists"
          value={stats.pendingTherapists}
          color="border-yellow-500"
          action="/admin/therapists"
          actionText="Review"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          color="border-purple-500"
        />
        <StatCard
          title="Flagged Posts"
          value={stats.flaggedPosts}
          color="border-red-500"
          action="/admin/content"
          actionText="Moderate"
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          color="border-indigo-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/admin/therapists"
            className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 text-center transition"
          >
            <div className="text-2xl mb-2">👨‍⚕️</div>
            <div className="font-semibold text-slate-900 text-sm">Verify Therapists</div>
          </Link>
          <Link
            to="/admin/content"
            className="bg-red-50 hover:bg-red-100 rounded-xl p-4 text-center transition"
          >
            <div className="text-2xl mb-2">🚫</div>
            <div className="font-semibold text-slate-900 text-sm">Moderate Content</div>
          </Link>
          <Link
            to="/admin/forum"
            className="bg-purple-50 hover:bg-purple-100 rounded-xl p-4 text-center transition"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold text-slate-900 text-sm">Moderate Forum</div>
          </Link>
          <Link
            to="/admin/users"
            className="bg-slate-50 hover:bg-slate-100 rounded-xl p-4 text-center transition"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold text-slate-900 text-sm">Manage Users</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
