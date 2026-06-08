import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function OrgAdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);

  useEffect(() => {
    fetchOrgData();
  }, []);

  async function fetchOrgData() {
    try {
      if (user?.organization_id) {
        const { data } = await api.get(`/organizations/${user.organization_id}`);
        setOrgData(data.organization);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Organization Profile', icon: '🏢' },
    { id: 'team', label: 'Team Management', icon: '👥' },
    { id: 'services', label: 'Services', icon: '⚙️' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'events', label: 'Events & Workshops', icon: '🎯' },
    { id: 'reports', label: 'Reports', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-600">Organization Manager</h1>
            <p className="text-sm text-slate-600 mt-1">{orgData?.name || 'Your Organization'}</p>
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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
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
          <OverviewTab orgId={user?.organization_id} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab orgId={user?.organization_id} />
        )}

        {activeTab === 'team' && (
          <TeamTab orgId={user?.organization_id} />
        )}

        {activeTab === 'services' && (
          <ServicesTab orgId={user?.organization_id} />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab orgId={user?.organization_id} />
        )}

        {activeTab === 'events' && (
          <EventsTab orgId={user?.organization_id} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab orgId={user?.organization_id} />
        )}
      </main>
    </div>
  );
}

function OverviewTab({ orgId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [orgId]);

  async function fetchStats() {
    try {
      // Fetch various stats
      const members = await api.get(`/organizations/${orgId}/members`);
      setStats({
        staff_count: members.data.members.length,
        active_clients: 0,
        monthly_sessions: 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Organization Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Staff Members</h3>
          <p className="text-4xl font-bold text-green-600">{stats?.staff_count || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">Active Clients</h3>
          <p className="text-4xl font-bold text-blue-600">{stats?.active_clients || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">This Month Sessions</h3>
          <p className="text-4xl font-bold text-orange-600">{stats?.monthly_sessions || 0}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ orgId }) {
  const [profile, setProfile] = useState({
    address_line_1: '',
    city: '',
    state: '',
    postal_code: '',
    phone_1: '',
    phone_2: '',
    about_us: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.post(`/organizations/${orgId}/details`, profile);
      alert('Organization profile saved!');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Organization Profile</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <input
              type="text"
              value={profile.address_line_1}
              onChange={(e) => setProfile({ ...profile, address_line_1: e.target.value })}
              placeholder="Street address"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="City"
              className="rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="text"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              placeholder="State"
              className="rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="text"
              value={profile.postal_code}
              onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
              placeholder="Postal Code"
              className="rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="tel"
              value={profile.phone_1}
              onChange={(e) => setProfile({ ...profile, phone_1: e.target.value })}
              placeholder="Phone 1"
              className="rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="tel"
              value={profile.phone_2}
              onChange={(e) => setProfile({ ...profile, phone_2: e.target.value })}
              placeholder="Phone 2 (Optional)"
              className="rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">About Us</label>
            <textarea
              value={profile.about_us}
              onChange={(e) => setProfile({ ...profile, about_us: e.target.value })}
              placeholder="Tell parents about your organization..."
              rows="4"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamTab({ orgId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  async function fetchMembers() {
    try {
      const { data } = await api.get(`/organizations/${orgId}/members`);
      setMembers(data.members || []);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Team Members</h2>
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No team members yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.user_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900">{member.name}</h3>
              <p className="text-sm text-slate-600 mt-1">Position: {member.position}</p>
              <p className="text-sm text-slate-600">Email: {member.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesTab({ orgId }) {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ service_name: '', description: '', price_range: '' });

  useEffect(() => {
    fetchServices();
  }, [orgId]);

  async function fetchServices() {
    try {
      const { data } = await api.get(`/organizations/${orgId}/services`);
      setServices(data.services || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function addService() {
    if (!newService.service_name) {
      alert('Service name is required');
      return;
    }
    try {
      await api.post(`/organizations/${orgId}/services`, newService);
      setNewService({ service_name: '', description: '', price_range: '' });
      fetchServices();
    } catch (err) {
      alert('Failed to add service');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Services Offered</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl">
        <h3 className="font-bold text-slate-900 mb-4">Add New Service</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={newService.service_name}
            onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
            placeholder="Service name (e.g., Speech Therapy)"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
          />
          <textarea
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            placeholder="Description"
            rows="3"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
          />
          <input
            type="text"
            value={newService.price_range}
            onChange={(e) => setNewService({ ...newService, price_range: e.target.value })}
            placeholder="Price range (e.g., $50-75 per session)"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
          />
          <button
            onClick={addService}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Add Service
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="text-center text-slate-600">No services added yet</div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900">{service.service_name}</h3>
              <p className="text-sm text-slate-600 mt-2">{service.description}</p>
              <p className="text-sm font-semibold text-green-600 mt-2">{service.price_range}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab({ orgId }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">All Appointments</h2>
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <p className="text-blue-900">📅 Appointment oversight coming soon...</p>
      </div>
    </div>
  );
}

function EventsTab({ orgId }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Events & Workshops</h2>
      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
        <p className="text-orange-900">🎯 Event management coming soon...</p>
      </div>
    </div>
  );
}

function ReportsTab({ orgId }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Reports & Analytics</h2>
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
        <p className="text-purple-900">📈 Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
}
