import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.dashboard);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'therapist-verify', label: 'Therapist Verification', icon: '✅' },
    { id: 'org-verify', label: 'Organization Verification', icon: '🏢' },
    { id: 'moderation', label: 'Content Moderation', icon: '🛡️' },
    { id: 'resources', label: 'Resources', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
    { id: 'settings', label: 'System Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">Admin Panel</h1>
            <p className="text-sm text-slate-600 mt-1">Platform Management • {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} loading={loading} />
        )}

        {activeTab === 'users' && (
          <UserManagementTab />
        )}

        {activeTab === 'therapist-verify' && (
          <TherapistVerificationTab />
        )}

        {activeTab === 'org-verify' && (
          <OrgVerificationTab />
        )}

        {activeTab === 'moderation' && (
          <ModerationTab />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}

        {activeTab === 'audit' && (
          <AuditLogsTab />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </main>
    </div>
  );
}

function OverviewTab({ stats, loading }) {
  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-slate-900">{stats?.total_users || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Therapists</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_therapists || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Organizations</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.total_organizations || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Appointments</h3>
          <p className="text-3xl font-bold text-orange-600">{stats?.total_appointments || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Community Posts</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.recent_posts || 0}</p>
        </div>
      </div>
    </div>
  );
}

function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  async function fetchUsers() {
    try {
      const { data } = await api.get(`/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function suspendUser(userId) {
    if (confirm('Suspend this user?')) {
      try {
        await api.put(`/admin/users/${userId}/suspend`, { reason: 'Suspended by admin' });
        alert('User suspended');
        fetchUsers();
      } catch (err) {
        alert('Failed to suspend user');
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">User Management</h2>

      <div className="mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">All Users</option>
          <option value="parent">Parents</option>
          <option value="therapist">Therapists</option>
          <option value="organization_admin">Org Admins</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading users...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No users found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{u.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{u.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                    {u.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => suspendUser(u.id)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                  >
                    Suspend
                  </button>
                  <button className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition">
                    Ban
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TherapistVerificationTab() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTherapists();
  }, []);

  async function fetchTherapists() {
    try {
      const { data } = await api.get('/admin/therapist-verification');
      setTherapists(data.therapists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approveTherapist(therapistId) {
    try {
      await api.put(`/admin/therapist-verification/${therapistId}/approve`);
      alert('Therapist approved!');
      fetchTherapists();
    } catch (err) {
      alert('Failed to approve');
    }
  }

  async function rejectTherapist(therapistId) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.put(`/admin/therapist-verification/${therapistId}/reject`, { reason });
      alert('Therapist rejected');
      fetchTherapists();
    } catch (err) {
      alert('Failed to reject');
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Therapist Verification</h2>
      <p className="text-slate-600 mb-6">Review and approve pending therapist registrations</p>

      {therapists.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No pending therapists</p>
        </div>
      ) : (
        <div className="space-y-4">
          {therapists.map((therapist) => (
            <div key={therapist.user_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{therapist.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{therapist.email}</p>
                  <p className="text-sm text-slate-600 mt-2">Experience: {therapist.years_experience} years</p>
                  <p className="text-sm text-slate-600">Specializations: {therapist.specializations}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    {therapist.verification_status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveTherapist(therapist.user_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectTherapist(therapist.user_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgVerificationTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Organization Verification</h2>
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <p className="text-blue-900">🏢 Organization verification management coming soon...</p>
      </div>
    </div>
  );
}

function ModerationTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Content Moderation</h2>
      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
        <p className="text-orange-900">🛡️ Moderation dashboard coming soon...</p>
      </div>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Resource Management</h2>
      <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
        <p className="text-green-900">📚 Resource library coming soon...</p>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Analytics & Reports</h2>
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
        <p className="text-purple-900">📈 Detailed analytics coming soon...</p>
      </div>
    </div>
  );
}

function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const { data } = await api.get('/admin/audit-logs?limit=20');
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Audit Logs</h2>
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No audit logs yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{log.action}</p>
                  <p className="text-slate-600 mt-1">Admin: {log.admin_name}</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">System Settings</h2>
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
        <p className="text-indigo-900">⚙️ System configuration coming soon...</p>
      </div>
    </div>
  );
}
