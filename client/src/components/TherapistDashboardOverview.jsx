import { useState, useEffect } from 'react';
import api from '../api';

export default function TherapistDashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [dashboardCards, setDashboardCards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    try {
      const { data } = await api.get('/therapist/appointments/overview');
      setOverview(data.overview);
      setDashboardCards(data.dashboard_cards);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading overview...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Main Metrics Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            label="Total Appointments"
            value={overview?.total_appointments || 0}
            icon=""
            color="blue"
            subtext="All time"
          />
          <MetricCard
            label="Upcoming Appointments"
            value={overview?.upcoming_appointments || 0}
            icon="⏰"
            color="green"
            subtext="Future appointments"
          />
          <MetricCard
            label="Completed Sessions"
            value={overview?.completed_sessions || 0}
            icon=""
            color="purple"
            subtext="Finished appointments"
          />
          <MetricCard
            label="Pending Requests"
            value={overview?.pending_requests || 0}
            icon=""
            color="orange"
            subtext="Awaiting your response"
            highlight={overview?.pending_requests > 0}
          />
          <MetricCard
            label="Families Served"
            value={overview?.families_served || 0}
            icon=""
            color="pink"
            subtext="Unique parents"
          />
          <MetricCard
            label="Verification Status"
            value={overview?.verification_status?.charAt(0).toUpperCase() + overview?.verification_status?.slice(1)}
            icon={
              overview?.verification_status === 'approved' ? '' :
              overview?.verification_status === 'pending' ? '' :
              overview?.verification_status === 'rejected' ? '' : ''
            }
            color={
              overview?.verification_status === 'approved' ? 'green' :
              overview?.verification_status === 'pending' ? 'yellow' : 'red'
            }
            subtext="Your verification"
          />
        </div>
      </div>

      {/* Dashboard Cards - Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickCard
            title="Today's Appointments"
            count={dashboardCards?.todays_appointments || 0}
            icon=""
            color="blue"
            description="Appointments scheduled for today"
          />
          <QuickCard
            title="This Week"
            count={dashboardCards?.this_week_appointments || 0}
            icon=""
            color="green"
            description="Upcoming this week"
          />
          <QuickCard
            title="New Messages"
            count={dashboardCards?.new_messages || 0}
            icon=""
            color="purple"
            description="Unread messages"
            highlight={dashboardCards?.new_messages > 0}
          />
          <QuickCard
            title="Pending Verifications"
            count={dashboardCards?.pending_verifications || 0}
            icon=""
            color="orange"
            description="Documents awaiting review"
            highlight={dashboardCards?.pending_verifications > 0}
          />
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4"> Quick Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem
            label="Success Rate"
            value={overview?.completed_sessions && overview?.total_appointments
              ? `${Math.round((overview.completed_sessions / overview.total_appointments) * 100)}%`
              : '0%'}
            icon=""
          />
          <StatItem
            label="Response Rate"
            value={overview?.pending_requests && overview?.upcoming_appointments
              ? `${100 - Math.round((overview.pending_requests / (overview.pending_requests + overview.upcoming_appointments)) * 100)}%`
              : '100%'}
            icon=""
          />
          <StatItem
            label="Families Served"
            value={overview?.families_served || 0}
            icon=""
          />
          <StatItem
            label="Active Status"
            value={overview?.verification_status === 'approved' ? 'Active' : 'Not Active'}
            icon={overview?.verification_status === 'approved' ? '' : ''}
          />
        </div>
      </div>

      {/* Status Section */}
      {overview?.verification_status !== 'approved' && (
        <div className={`rounded-2xl p-6 border-2 ${
          overview?.verification_status === 'pending'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${
            overview?.verification_status === 'pending'
              ? 'text-yellow-900'
              : 'text-red-900'
          }`}>
             Verification Status
          </h3>
          <p className={`text-sm ${
            overview?.verification_status === 'pending'
              ? 'text-yellow-800'
              : 'text-red-800'
          }`}>
            {overview?.verification_status === 'pending'
              ? 'Your verification is pending. Please upload your documents to get approved.'
              : 'Your verification has been rejected. Please review the feedback and reapply.'}
          </p>
        </div>
      )}
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
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200'
  };

  const borderClass = highlight ? `border-2 ${colors[color]}` : `border ${colors[color]}`;

  return (
    <div className={`rounded-2xl p-6 shadow-sm ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{icon}</span>
        {highlight && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Action needed</span>}
      </div>
      <h4 className="text-sm font-medium text-slate-600 mb-1">{label}</h4>
      <p className="text-4xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
  );
}

function QuickCard({ title, count, icon, color, description, highlight }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${highlight ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-slate-900'}`}>
          {count}
        </span>
      </div>
      <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600 mt-2">{label}</p>
    </div>
  );
}
