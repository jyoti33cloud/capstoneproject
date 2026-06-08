import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function TherapistDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data } = await api.get('/therapists/dashboard');
      setStats(data.dashboard);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'qualifications', label: 'Qualifications', icon: '🎓' },
    { id: 'availability', label: 'Availability', icon: '⏰' },
    { id: 'progress', label: 'Progress Notes', icon: '📝' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Therapist Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Welcome, {user?.name}</p>
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
                    ? 'border-blue-600 text-blue-600'
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
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Overview</h2>
            {loading ? (
              <p className="text-slate-600">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Appointments</h3>
                  <p className="text-4xl font-bold text-blue-600">{stats?.total_appointments || 0}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Upcoming Appointments</h3>
                  <p className="text-4xl font-bold text-green-600">{stats?.upcoming_appointments || 0}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Pending Requests</h3>
                  <p className="text-4xl font-bold text-orange-600">{stats?.appointment_requests || 0}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">Active Patients</h3>
                  <p className="text-4xl font-bold text-purple-600">{stats?.patient_count || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab />
        )}

        {activeTab === 'profile' && (
          <ProfileTab />
        )}

        {activeTab === 'qualifications' && (
          <QualificationsTab />
        )}

        {activeTab === 'availability' && (
          <AvailabilityTab />
        )}

        {activeTab === 'progress' && (
          <ProgressNotesTab />
        )}
      </main>
    </div>
  );
}

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const { data } = await api.get('/appointments/therapist');
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading appointments...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">My Appointments</h2>
      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No appointments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{apt.parent_name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    📅 {apt.appointment_date} at {apt.start_time}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Status: <span className="font-semibold text-blue-600">{apt.status}</span></p>
                </div>
                {apt.status === 'requested' && (
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                      Confirm
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const [profile, setProfile] = useState({
    bio: '',
    years_experience: 0,
    consultation_fee: 0,
    languages: 'English',
    specializations: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.post('/therapists/profile', profile);
      alert('Profile saved successfully!');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">My Profile</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Write about yourself..."
              rows="4"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
              <input
                type="number"
                value={profile.years_experience}
                onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Fee ($)</label>
              <input
                type="number"
                value={profile.consultation_fee}
                onChange={(e) => setProfile({ ...profile, consultation_fee: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Languages</label>
            <input
              type="text"
              value={profile.languages}
              onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
              placeholder="e.g., English, Spanish, Hindi"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Specializations</label>
            <input
              type="text"
              value={profile.specializations}
              onChange={(e) => setProfile({ ...profile, specializations: e.target.value })}
              placeholder="e.g., Speech Therapy, ABA, Occupational Therapy"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QualificationsTab() {
  const [qualifications, setQualifications] = useState([]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Qualifications & Certifications</h2>
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <p className="text-blue-900">🎓 Qualification management coming soon...</p>
      </div>
    </div>
  );
}

function AvailabilityTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Availability Schedule</h2>
      <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
        <p className="text-green-900">⏰ Availability management coming soon...</p>
      </div>
    </div>
  );
}

function ProgressNotesTab() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Progress Notes</h2>
      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
        <p className="text-purple-900">📝 Progress notes management coming soon...</p>
      </div>
    </div>
  );
}
