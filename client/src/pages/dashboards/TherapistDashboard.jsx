import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import TherapistDashboardOverview from '../../components/TherapistDashboardOverview';
import TherapistAppointmentsManagement from '../../components/TherapistAppointmentsManagement';
import TherapistMessagingAdvanced from '../../components/TherapistMessagingAdvanced';

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
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'profile', label: 'My Profile' },
    { id: 'qualifications', label: 'Qualifications' },
    { id: 'availability', label: 'Availability' },
    { id: 'progress', label: 'Progress Notes' },
    { id: 'verification', label: 'Verification' },
    { id: 'messaging', label: 'Messages' }
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <TherapistDashboardOverview />
        )}

        {activeTab === 'appointments' && <TherapistAppointmentsManagement />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'qualifications' && <QualificationsTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'progress' && <ProgressNotesTab />}
        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'messaging' && <TherapistMessagingAdvanced />}
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

// NEW TABS BELOW - Add these to the existing file

// Verification Tab Component
export function VerificationTab() {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDoc, setNewDoc] = useState({
    document_type: 'license',
    document_url: ''
  });

  useEffect(() => {
    fetchVerificationData();
  }, []);

  async function fetchVerificationData() {
    try {
      const [docRes, statusRes] = await Promise.all([
        api.get('/verification/my-documents'),
        api.get('/verification/status')
      ]);
      setDocuments(docRes.data.documents || []);
      setStatus(statusRes.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDocument() {
    if (!newDoc.document_url) {
      alert('Please enter document URL');
      return;
    }
    try {
      await api.post('/verification/upload', newDoc);
      setNewDoc({ document_type: 'license', document_url: '' });
      fetchVerificationData();
      alert('Document uploaded! Pending admin review.');
    } catch (err) {
      alert('Failed to upload document');
    }
  }

  async function deleteDocument(id) {
    if (confirm('Delete this document?')) {
      try {
        await api.delete(`/verification/document/${id}`);
        fetchVerificationData();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">Verification & Credentials</h2>

      {/* Status Card */}
      <div className={`rounded-2xl p-6 shadow-sm border-2 mb-8 ${
        status.profile_status?.is_verified
          ? 'bg-green-50 border-green-300'
          : status.documents_summary?.verified > 0
          ? 'bg-yellow-50 border-yellow-300'
          : 'bg-orange-50 border-orange-300'
      }`}>
        <h3 className="font-bold text-lg mb-3">
          {status.profile_status?.is_verified ? '✅ Verified' : '⏳ Verification Pending'}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Total Submitted</p>
            <p className="text-2xl font-bold">{status.documents_summary?.total || 0}</p>
          </div>
          <div>
            <p className="text-slate-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{status.documents_summary?.verified || 0}</p>
          </div>
          <div>
            <p className="text-slate-600">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{status.documents_summary?.pending || 0}</p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl">
        <h3 className="font-bold text-slate-900 mb-4">Upload New Document</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
            <select
              value={newDoc.document_type}
              onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="license">License</option>
              <option value="certificate">Certificate</option>
              <option value="degree">Degree</option>
              <option value="registration">Registration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document URL</label>
            <input
              type="text"
              value={newDoc.document_url}
              onChange={(e) => setNewDoc({ ...newDoc, document_url: e.target.value })}
              placeholder="https://example.com/document.pdf"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={uploadDocument}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      {/* Documents List */}
      <h3 className="font-bold text-slate-900 mb-4">Submitted Documents</h3>
      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-600">No documents submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 capitalize">{doc.document_type}</h4>
                  <p className="text-sm text-slate-600 mt-2">
                    Status: <span className={`font-semibold ${
                      doc.status === 'verified' ? 'text-green-600' :
                      doc.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                    }`}>{doc.status}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Submitted: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  {doc.admin_notes && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                      Admin Notes: {doc.admin_notes}
                    </p>
                  )}
                </div>
                {doc.status === 'pending' && (
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Messaging Tab Component
export function MessagingTab() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, []);

  async function fetchInbox() {
    try {
      const { data } = await api.get('/messages/inbox');
      // Get unique senders
      const uniqueSenders = {};
      data.messages?.forEach(msg => {
        if (!uniqueSenders[msg.sender_id]) {
          uniqueSenders[msg.sender_id] = {
            user_id: msg.sender_id,
            name: msg.sender_name,
            avatar: msg.avatar_url
          };
        }
      });
      setConversations(Object.values(uniqueSenders));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function openConversation(userId) {
    try {
      const { data } = await api.get(`/messages/conversation/${userId}`);
      setMessages(data.messages || []);
      setSelectedUser(userId);
    } catch (err) {
      alert('Failed to load conversation');
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      await api.post('/messages/send', {
        receiver_id: selectedUser,
        content: newMessage
      });
      setNewMessage('');
      await openConversation(selectedUser);
    } catch (err) {
      alert('Failed to send message');
    }
  }

  if (loading) return <p className="text-slate-600">Loading...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversation List */}
      <div className="lg:col-span-1">
        <h3 className="font-bold text-slate-900 mb-4">Messages</h3>
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-200">
            <p className="text-sm text-slate-600">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => openConversation(conv.user_id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition ${
                  selectedUser === conv.user_id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-blue-200'
                }`}
              >
                <p className="font-bold text-slate-900 text-sm">{conv.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2">
        {selectedUser ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-96 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-slate-600 text-sm">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender_id === selectedUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === selectedUser
                          ? 'bg-slate-100 text-slate-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === selectedUser ? 'text-slate-600' : 'text-blue-100'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 h-96 flex items-center justify-center">
            <p className="text-slate-600">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
