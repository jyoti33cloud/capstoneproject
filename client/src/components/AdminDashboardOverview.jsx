import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminDashboardOverview() {
  const [metrics, setMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersBreakdown, setUsersBreakdown] = useState([]);
  const [appointmentsBreakdown, setAppointmentsBreakdown] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      const [overviewRes, healthRes, usersRes, appointmentsRes] = await Promise.all([
        api.get('/admin/dashboard/overview'),
        api.get('/admin/dashboard/platform-health'),
        api.get('/admin/dashboard/users-breakdown'),
        api.get('/admin/dashboard/appointments-by-status')
      ]);

      setMetrics(overviewRes.data.metrics);
      setRecentActivities(overviewRes.data.recent_activities);
      setPlatformStats(overviewRes.data.platform_statistics);
      setHealth(healthRes.data.health);
      setUsersBreakdown(usersRes.data.breakdown);
      setAppointmentsBreakdown(appointmentsRes.data.breakdown);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setLoading(false);
    }
  }

  async function handleExport(type) {
    try {
      const { data } = await api.get(`/admin/dashboard/export?type=${type}`);

      // Download as JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asha-export-${type}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();

      alert('✅ Export downloaded successfully!');
    } catch (err) {
      alert('Failed to export data');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Main Metrics Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            label="Total Users"
            value={metrics?.total_users || 0}
            icon="👥"
            color="blue"
            subtext={`${usersBreakdown.find(b => b.role === 'parent')?.count || 0} parents`}
          />
          <MetricCard
            label="Total Therapists"
            value={metrics?.total_therapists || 0}
            icon="👨‍⚕️"
            color="green"
            subtext={`${metrics?.pending_verifications || 0} pending approval`}
          />
          <MetricCard
            label="Total Organizations"
            value={metrics?.total_organizations || 0}
            icon="🏢"
            color="purple"
            subtext="Centers & facilities"
          />
          <MetricCard
            label="Total Appointments"
            value={metrics?.total_appointments || 0}
            icon="📅"
            color="orange"
            subtext={`${appointmentsBreakdown.find(a => a.status === 'completed')?.count || 0} completed`}
          />
          <MetricCard
            label="Community Posts"
            value={metrics?.total_posts || 0}
            icon="💬"
            color="pink"
            subtext="Forum discussions"
          />
          <MetricCard
            label="Pending Verifications"
            value={metrics?.pending_verifications || 0}
            icon="⏳"
            color="yellow"
            subtext="Awaiting review"
            highlight={metrics?.pending_verifications > 0}
          />
        </div>
      </div>

      {/* Platform Health & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Health */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Health</h3>
          <div className="space-y-4">
            <HealthMetric
              label="New Users (30 days)"
              value={health?.new_users_30days || 0}
              icon="📈"
            />
            <HealthMetric
              label="Appointments (30 days)"
              value={health?.appointments_30days || 0}
              icon="📅"
            />
            <HealthMetric
              label="Therapist Verification Rate"
              value={`${health?.verification_rate || 0}%`}
              icon="✅"
            />
            <HealthMetric
              label="Active Specialists (30 days)"
              value={health?.active_specialists_30days || 0}
              icon="👨‍💼"
            />
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700">
                System Status: <span className="text-green-600">✅ Healthy</span>
              </p>
            </div>
          </div>
        </div>

        {/* Users & Appointments Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">User & Appointment Breakdown</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Users by Role</h4>
              <div className="space-y-2">
                {usersBreakdown.map((item) => (
                  <div key={item.role} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 capitalize">{item.role}</span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Appointments by Status</h4>
              <div className="space-y-2">
                {appointmentsBreakdown.map((item) => (
                  <div key={item.status} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 capitalize">{item.status}</span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton
            label="Export All Data"
            icon="📊"
            onClick={() => handleExport('full')}
            color="blue"
          />
          <ActionButton
            label="Export Users"
            icon="👥"
            onClick={() => handleExport('users')}
            color="green"
          />
          <ActionButton
            label="Export Therapists"
            icon="👨‍⚕️"
            onClick={() => handleExport('therapists')}
            color="purple"
          />
          <ActionButton
            label="Export Appointments"
            icon="📅"
            onClick={() => handleExport('appointments')}
            color="orange"
          />
        </div>
        <p className="text-sm text-slate-600 mt-4">
          💡 Exports are downloaded as JSON files for use in external tools
        </p>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Admin Activities</h3>
        {recentActivities.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Platform Statistics Summary */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Statistics Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <StatBox
            label="Total Users"
            value={platformStats?.total_users || 0}
            icon="👥"
          />
          <StatBox
            label="Therapists"
            value={platformStats?.therapists || 0}
            icon="👨‍⚕️"
          />
          <StatBox
            label="Org Admins"
            value={platformStats?.organizations_admin || 0}
            icon="👔"
          />
          <StatBox
            label="Completed Appts"
            value={platformStats?.completed_appointments || 0}
            icon="✅"
          />
          <StatBox
            label="Posts"
            value={platformStats?.community_posts || 0}
            icon="💬"
          />
          <StatBox
            label="Unique Parents"
            value={platformStats?.unique_parents || 0}
            icon="👨‍👩‍👧"
          />
          <StatBox
            label="Active Therapists"
            value={platformStats?.active_therapists || 0}
            icon="📊"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, subtext, highlight }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    pink: 'bg-pink-50 border-pink-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  const borderClass = highlight ? `border-2 ${colors[color]}` : `border border-slate-200 ${colors[color]}`;

  return (
    <div className={`rounded-2xl p-6 shadow-sm ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {highlight && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Action needed</span>}
      </div>
      <h4 className="text-sm font-medium text-slate-600 mb-1">{label}</h4>
      <p className="text-4xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
  );
}

function HealthMetric({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}

function ActionButton({ label, icon, onClick, color }) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white rounded-lg p-4 transition text-center`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold">{label}</div>
    </button>
  );
}

function ActivityRow({ activity }) {
  const actionIcons = {
    SUSPEND_USER: '⛔',
    BAN_USER: '🚫',
    APPROVE_THERAPIST: '✅',
    REJECT_THERAPIST: '❌',
    APPROVE_ORG: '✅',
    DELETE_POST: '🗑️',
    default: '📋'
  };

  const icon = actionIcons[activity.action] || actionIcons.default;

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
      <span className="text-2xl mt-1">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{activity.action.replace(/_/g, ' ')}</p>
        <p className="text-sm text-slate-600 mt-1">
          By: <span className="font-medium">{activity.admin_name || 'System'}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {new Date(activity.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-600 mt-2">{label}</p>
    </div>
  );
}
