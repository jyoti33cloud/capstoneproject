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
                <StatCard label="Total Appointments" value={stats?.total_appointments || 0} color="blue" />
                <StatCard label="Upcoming Appointments" value={stats?.upcoming_appointments || 0} color="green" />
                <StatCard label="Pending Requests" value={stats?.appointment_requests || 0} color="orange" />
                <StatCard label="Active Patients" value={stats?.patient_count || 0} color="purple" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'qualifications' && <QualificationsTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'progress' && <ProgressNotesTab />}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-600 mb-2">{label}</h3>
      <p className={`text-4xl font-bold ${colors[color]}`}>{value}</p>
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

  async function updateStatus(aptId, status) {
    try {
      await api.put(`/appointments/${aptId}/status`, { status });
      alert('Appointment updated!');
      fetchAppointments();
    } catch (err) {
      alert('Failed to update appointment');
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
            <AptCard key={apt.id} apt={apt} onUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function AptCard({ apt, onUpdate }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{apt.parent_name}</h3>
          <p className="text-sm text-slate-600 mt-2">📅 {apt.appointment_date} at {apt.start_time}</p>
          <p className={`text-sm font-semibold mt-1 ${
            apt.status === 'confirmed' ? 'text-green-600' :
            apt.status === 'requested' ? 'text-orange-600' : 'text-slate-600'
          }`}>
            Status: {apt.status}
          </p>
          {apt.notes && <p className="text-sm text-slate-600 mt-2">📝 {apt.notes}</p>}
        </div>
        <div className="flex gap-2">
          {apt.status === 'requested' && (
            <>
              <button
                onClick={() => onUpdate(apt.id, 'confirmed')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => onUpdate(apt.id, 'cancelled')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Decline
              </button>
            </>
          )}
          {apt.status === 'confirmed' && (
            <button
              onClick={() => onUpdate(apt.id, 'completed')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Mark Done
            </button>
          )}
        </div>
      </div>
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
      <h2 className="text-xl font-bold text-slate-900 mb-6">My Professional Profile</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-2xl">
        <div className="space-y-6">
          <TextAreaField
            label="Bio"
            value={profile.bio}
            onChange={(v) => setProfile({ ...profile, bio: v })}
            placeholder="Write about yourself..."
            rows={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Years of Experience"
              value={profile.years_experience}
              onChange={(v) => setProfile({ ...profile, years_experience: v })}
            />
            <NumberField
              label="Consultation Fee ($)"
              value={profile.consultation_fee}
              onChange={(v) => setProfile({ ...profile, consultation_fee: v })}
            />
          </div>

          <TextField
            label="Languages"
            value={profile.languages}
            onChange={(v) => setProfile({ ...profile, languages: v })}
            placeholder="e.g., English, Spanish, Hindi"
          />

          <TextField
            label="Specializations"
            value={profile.specializations}
            onChange={(v) => setProfile({ ...profile, specializations: v })}
            placeholder="e.g., Speech Therapy, ABA, OT"
          />

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
  const [loading, setLoading] = useState(true);
  const [newQual, setNewQual] = useState({
    qualification_type: 'certificate',
    title: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchQualifications();
  }, []);

  async function fetchQualifications() {
    try {
      const { data } = await api.get('/therapists/qualifications');
      setQualifications(data.qualifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addQualification() {
    if (!newQual.title) {
      alert('Please enter qualification title');
      return;
    }
    try {
      await api.post('/therapists/qualifications', newQual);
      setNewQual({ qualification_type: 'certificate', title: '', issuing_organization: '', issue_date: '', expiry_date: '' });
      fetchQualifications();
    } catch (err) {
      alert('Failed to add qualification');
    }
  }

  async function deleteQualification(id) {
    if (confirm('Delete this qualification?')) {
      try {
        await api.delete(`/therapists/qualifications/${id}`);
        fetchQualifications();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Qualifications & Certifications</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl">
        <h3 className="font-bold text-slate-900 mb-4">Add New Qualification</h3>
        <div className="space-y-4">
          <SelectField
            label="Type"
            value={newQual.qualification_type}
            onChange={(v) => setNewQual({ ...newQual, qualification_type: v })}
            options={[
              { value: 'certificate', label: 'Certificate' },
              { value: 'degree', label: 'Degree' },
              { value: 'license', label: 'License' }
            ]}
          />

          <TextField
            label="Title"
            value={newQual.title}
            onChange={(v) => setNewQual({ ...newQual, title: v })}
            placeholder="e.g., Bachelor in Speech Therapy"
          />

          <TextField
            label="Issuing Organization"
            value={newQual.issuing_organization}
            onChange={(v) => setNewQual({ ...newQual, issuing_organization: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Issue Date"
              value={newQual.issue_date}
              onChange={(v) => setNewQual({ ...newQual, issue_date: v })}
            />
            <DateField
              label="Expiry Date"
              value={newQual.expiry_date}
              onChange={(v) => setNewQual({ ...newQual, expiry_date: v })}
            />
          </div>

          <button
            onClick={addQualification}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Add Qualification
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : qualifications.length === 0 ? (
        <div className="text-center text-slate-600 bg-white rounded-2xl p-8 border border-slate-200">
          No qualifications added yet
        </div>
      ) : (
        <div className="space-y-4">
          {qualifications.map((qual) => (
            <QualCard key={qual.id} qual={qual} onDelete={deleteQualification} />
          ))}
        </div>
      )}
    </div>
  );
}

function QualCard({ qual, onDelete }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-900">{qual.title}</h3>
          <p className="text-sm text-slate-600 mt-2">Organization: {qual.issuing_organization}</p>
          <p className="text-sm text-slate-600">Type: <span className="font-semibold">{qual.qualification_type}</span></p>
          {qual.issue_date && <p className="text-sm text-slate-600">Issued: {qual.issue_date}</p>}
          {qual.expiry_date && <p className="text-sm text-slate-600">Expires: {qual.expiry_date}</p>}
        </div>
        <button
          onClick={() => onDelete(qual.id)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AvailabilityTab() {
  const [availability, setAvailability] = useState([]);
  const [newAvail, setNewAvail] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00'
  });
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    try {
      const { data } = await api.get('/therapists/availability');
      setAvailability(data.availability || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addAvailability() {
    try {
      await api.post('/therapists/availability', newAvail);
      setNewAvail({ day_of_week: 0, start_time: '09:00', end_time: '17:00' });
      fetchAvailability();
    } catch (err) {
      alert('Failed to set availability');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Availability Schedule</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl">
        <h3 className="font-bold text-slate-900 mb-4">Add Available Times</h3>
        <div className="space-y-4">
          <SelectField
            label="Day"
            value={newAvail.day_of_week}
            onChange={(v) => setNewAvail({ ...newAvail, day_of_week: parseInt(v) })}
            options={days.map((day, idx) => ({ value: idx.toString(), label: day }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
              <input
                type="time"
                value={newAvail.start_time}
                onChange={(e) => setNewAvail({ ...newAvail, start_time: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
              <input
                type="time"
                value={newAvail.end_time}
                onChange={(e) => setNewAvail({ ...newAvail, end_time: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={addAvailability}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Add Availability
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : availability.length === 0 ? (
        <div className="text-center text-slate-600 bg-white rounded-2xl p-8 border border-slate-200">
          No availability set yet
        </div>
      ) : (
        <div className="space-y-3">
          {availability.map((avail) => (
            <div key={avail.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="font-bold text-slate-900">{days[avail.day_of_week]}</p>
              <p className="text-sm text-slate-600 mt-1">⏰ {avail.start_time} - {avail.end_time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressNotesTab() {
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState({
    appointment_id: '',
    observations: '',
    recommendations: '',
    milestones: '',
    next_steps: ''
  });

  useEffect(() => {
    fetchCompletedAppointments();
  }, []);

  async function fetchCompletedAppointments() {
    try {
      const { data } = await api.get('/appointments/therapist');
      setAppointments(data.appointments?.filter(a => a.status === 'completed') || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function addProgressNote() {
    if (!newNote.appointment_id || !newNote.observations) {
      alert('Please fill in required fields');
      return;
    }
    try {
      await api.post(`/appointments/${newNote.appointment_id}/session-notes`, {
        session_notes: newNote.observations,
        observations: newNote.observations,
        recommendations: newNote.recommendations,
        milestones: newNote.milestones,
        next_steps: newNote.next_steps
      });
      setNewNote({ appointment_id: '', observations: '', recommendations: '', milestones: '', next_steps: '' });
      setShowForm(false);
      alert('Progress note saved!');
    } catch (err) {
      alert('Failed to save progress note');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Progress Notes & Session Records</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
      >
        {showForm ? 'Cancel' : '+ Add Progress Note'}
      </button>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-4">Create Progress Note</h3>
          <div className="space-y-4">
            <SelectField
              label="Completed Appointment"
              value={newNote.appointment_id}
              onChange={(v) => setNewNote({ ...newNote, appointment_id: v })}
              options={[
                { value: '', label: 'Select appointment...' },
                ...appointments.map(apt => ({
                  value: apt.id.toString(),
                  label: `${apt.parent_name} - ${apt.appointment_date}`
                }))
              ]}
            />

            <TextAreaField
              label="Observations"
              value={newNote.observations}
              onChange={(v) => setNewNote({ ...newNote, observations: v })}
              placeholder="What did you observe during the session?"
              rows={3}
            />

            <TextAreaField
              label="Recommendations"
              value={newNote.recommendations}
              onChange={(v) => setNewNote({ ...newNote, recommendations: v })}
              placeholder="Recommendations for parents/caregivers"
              rows={3}
            />

            <TextAreaField
              label="Milestones Achieved"
              value={newNote.milestones}
              onChange={(v) => setNewNote({ ...newNote, milestones: v })}
              placeholder="Any developmental milestones achieved"
              rows={2}
            />

            <TextAreaField
              label="Next Steps"
              value={newNote.next_steps}
              onChange={(v) => setNewNote({ ...newNote, next_steps: v })}
              placeholder="Plan for next session"
              rows={2}
            />

            <button
              onClick={addProgressNote}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Save Progress Note
            </button>
          </div>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <p className="text-blue-900">📝 Complete appointments to add progress notes</p>
        </div>
      ) : (
        <div className="text-slate-600 text-center">
          {appointments.length} completed appointment(s) available for progress notes
        </div>
      )}
    </div>
  );
}

// Reusable Form Components
function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
