import { useState, useEffect } from 'react';
import api from '../api';

export default function OrganizationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add staff form
  const [addForm, setAddForm] = useState({
    staffType: 'therapist', // therapist, psychologist, educator, counselor, custom
    name: '',
    email: '',
    position: '',
    specialization: ''
  });

  // Staff profile modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editForm, setEditForm] = useState({ position: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data } = await api.get('/org-dashboard/overview');
        setOverview(data);
      } else if (activeTab === 'team') {
        const { data } = await api.get(`/org-dashboard/staff/all?search=${searchTerm}`);
        setStaff(data.staff);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setLoading(false);
    }
  }

  async function handleAddStaff() {
    if (!addForm.name || !addForm.email) {
      alert(' Name and email required');
      return;
    }

    try {
      let endpoint = '/org-dashboard/staff/add-member';
      let payload = { name: addForm.name, email: addForm.email, position: addForm.position };

      if (addForm.staffType === 'therapist') {
        endpoint = '/org-dashboard/staff/add-therapist';
      } else if (addForm.staffType === 'psychologist') {
        endpoint = '/org-dashboard/staff/add-psychologist';
      } else if (addForm.staffType === 'educator') {
        endpoint = '/org-dashboard/staff/add-educator';
      } else if (addForm.staffType === 'counselor') {
        endpoint = '/org-dashboard/staff/add-counselor';
      }

      await api.post(endpoint, payload);
      alert(' Staff member added successfully');
      setAddForm({ staffType: 'therapist', name: '', email: '', position: '', specialization: '' });
      setActiveTab('team');
      fetchData();
    } catch (err) {
      alert(' ' + (err.response?.data?.error || 'Failed to add staff member'));
    }
  }

  async function handleViewProfile(staffId) {
    try {
      const { data } = await api.get(`/org-dashboard/staff/${staffId}/profile`);
      setSelectedStaff(data.staff);
      setEditForm({ position: data.staff.position });
    } catch (err) {
      alert(' Failed to load profile');
    }
  }

  async function handleUpdatePosition() {
    if (!selectedStaff || !editForm.position) {
      alert(' Position required');
      return;
    }

    try {
      await api.put(`/org-dashboard/staff/${selectedStaff.id}/update`, {
        position: editForm.position
      });
      alert(' Position updated');
      setSelectedStaff(null);
      fetchData();
    } catch (err) {
      alert(' Failed to update position');
    }
  }

  async function handleRemoveStaff(staffId) {
    if (!window.confirm(' Remove this staff member?')) return;

    try {
      await api.delete(`/org-dashboard/staff/${staffId}/remove`);
      alert(' Staff member removed');
      setSelectedStaff(null);
      fetchData();
    } catch (err) {
      alert(' Failed to remove staff member');
    }
  }

  async function handleDisableAccount(staffId) {
    if (!window.confirm(' Disable this account?')) return;

    try {
      await api.put(`/org-dashboard/staff/${staffId}/disable`);
      alert(' Account disabled');
      setSelectedStaff(null);
      fetchData();
    } catch (err) {
      alert(' Failed to disable account');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Overview
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'team'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Team Management
        </button>
        <button
          onClick={() => setActiveTab('add-staff')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'add-staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Add Staff
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Organization Overview</h2>

          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading overview...</div>
          ) : (
            <>
              {/* Main Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                  label="Total Staff Members"
                  value={overview?.overview?.total_staff || 0}
                  icon=""
                  color="blue"
                />
                <MetricCard
                  label="Active Clients/Families"
                  value={overview?.overview?.active_clients || 0}
                  icon=""
                  color="green"
                />
                <MetricCard
                  label="Monthly Sessions"
                  value={overview?.overview?.monthly_sessions || 0}
                  icon=""
                  color="purple"
                />
                <MetricCard
                  label="Upcoming Appointments"
                  value={overview?.overview?.upcoming_appointments || 0}
                  icon="⏰"
                  color="orange"
                />
                <MetricCard
                  label="Upcoming Workshops"
                  value={overview?.overview?.upcoming_workshops || 0}
                  icon=""
                  color="pink"
                />
                <MetricCard
                  label="Active Services"
                  value={overview?.overview?.active_services || 0}
                  icon=""
                  color="yellow"
                />
              </div>

              {/* Dashboard Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Appointments */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4"> Recent Appointments</h3>
                  {overview?.dashboard_widgets?.recent_appointments?.length === 0 ? (
                    <p className="text-slate-600 text-center py-4">No recent appointments</p>
                  ) : (
                    <div className="space-y-3">
                      {overview?.dashboard_widgets?.recent_appointments?.map((apt) => (
                        <div key={apt.id} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-semibold text-slate-900">{apt.therapist_name}</p>
                          <p className="text-sm text-slate-600">with {apt.parent_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(apt.appointment_date).toLocaleDateString()} at {apt.start_time}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                            apt.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Monthly Statistics */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4"> Monthly Statistics</h3>
                  <div className="space-y-4">
                    <StatRow
                      label="Total Staff"
                      value={overview?.monthly_statistics?.total_staff || 0}
                      icon=""
                    />
                    <StatRow
                      label="Completed Sessions"
                      value={overview?.monthly_statistics?.completed_sessions || 0}
                      icon=""
                    />
                    <StatRow
                      label="Total Clients"
                      value={overview?.monthly_statistics?.total_clients || 0}
                      icon=""
                    />
                    <StatRow
                      label="Active Services"
                      value={overview?.monthly_statistics?.active_services || 0}
                      icon=""
                    />
                  </div>
                </div>

                {/* New Applications & Event Registrations */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4"> New Applications</h3>
                  <p className="text-4xl font-bold text-slate-900 mt-4">
                    {overview?.dashboard_widgets?.new_applications || 0}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Therapists pending verification</p>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4"> Event Registrations</h3>
                  <p className="text-4xl font-bold text-slate-900 mt-4">
                    {overview?.dashboard_widgets?.event_registrations || 0}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Total workshop registrations</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TEAM MANAGEMENT TAB */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>

          {/* Search */}
          <input
            type="text"
            placeholder=" Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchData();
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Staff List */}
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading staff...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No staff members found</div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Position</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900 font-medium">{member.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{member.email}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{member.position || ''}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleViewProfile(member.id)}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Staff Profile Modal */}
          {selectedStaff && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{selectedStaff.name}</h3>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="text-2xl text-slate-400 hover:text-slate-600"
                  >
                    
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <p className="text-sm"><span className="font-semibold">Email:</span> {selectedStaff.email}</p>
                  <p className="text-sm"><span className="font-semibold">Position:</span> {selectedStaff.position}</p>
                  <p className="text-sm"><span className="font-semibold">Joined:</span> {new Date(selectedStaff.joined_at).toLocaleDateString()}</p>
                  {selectedStaff.specializations && (
                    <p className="text-sm"><span className="font-semibold">Specialization:</span> {selectedStaff.specializations}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Update Position</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleUpdatePosition}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                     Update
                  </button>
                  <button
                    onClick={() => handleDisableAccount(selectedStaff.id)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                     Disable
                  </button>
                  <button
                    onClick={() => handleRemoveStaff(selectedStaff.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                     Remove
                  </button>
                </div>

                <button
                  onClick={() => setSelectedStaff(null)}
                  className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD STAFF TAB */}
      {activeTab === 'add-staff' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Add Staff Member</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Staff Type</label>
            <select
              value={addForm.staffType}
              onChange={(e) => setAddForm({ ...addForm, staffType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="therapist">Therapist / Specialist</option>
              <option value="psychologist">Psychologist</option>
              <option value="educator">Special Educator</option>
              <option value="counselor">Counselor</option>
              <option value="custom">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter name..."
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter email..."
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {addForm.staffType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Position Title</label>
              <input
                type="text"
                placeholder="e.g., Program Coordinator..."
                value={addForm.position}
                onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Specialization (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Speech Therapy, ABA..."
              value={addForm.specialization}
              onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAddStaff}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
             Add Staff Member
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    pink: 'bg-pink-50 border-pink-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div className={`rounded-lg p-6 border shadow-sm ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{icon}</span>
      </div>
      <h4 className="text-sm font-medium text-slate-600 mb-1">{label}</h4>
      <p className="text-3xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function StatRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}
