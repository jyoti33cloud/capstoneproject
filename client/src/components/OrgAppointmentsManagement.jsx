import { useState, useEffect } from 'react';
import api from '../api';

export default function OrgAppointmentsManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Forms
  const [rescheduleForm, setRescheduleForm] = useState({ appointmentId: '', date: '', start_time: '', end_time: '' });
  const [assignForm, setAssignForm] = useState({ appointmentId: '', therapist_id: '' });
  const [cancelForm, setCancelForm] = useState({ appointmentId: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);

      if (activeTab === 'upcoming') {
        params.append('date_from', new Date().toISOString().split('T')[0]);
      } else if (activeTab === 'completed') {
        params.append('status', 'completed');
      } else if (activeTab === 'cancelled') {
        params.append('status', 'cancelled');
      }

      const [aptsRes, therapistsRes] = await Promise.all([
        api.get(`/org-appointments/all?${params}`),
        api.get('/org-appointments/therapist-schedules')
      ]);

      setAppointments(aptsRes.data.appointments);
      setTherapists(therapistsRes.data.therapists);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setLoading(false);
    }
  }

  async function handleViewDetails(aptId) {
    try {
      const { data } = await api.get(`/org-appointments/all?limit=1`);
      const apt = data.appointments.find(a => a.id === aptId);
      setSelectedAppointment(apt);
      setRescheduleForm({ appointmentId: aptId, date: apt.appointment_date, start_time: apt.start_time, end_time: apt.end_time });
      setAssignForm({ appointmentId: aptId, therapist_id: apt.therapist_id });
    } catch (err) {
      alert('❌ Failed to load appointment details');
    }
  }

  async function handleReschedule() {
    if (!rescheduleForm.date || !rescheduleForm.start_time) {
      alert('❌ Date and time required');
      return;
    }

    try {
      await api.put(`/org-appointments/${rescheduleForm.appointmentId}/reschedule`, {
        appointment_date: rescheduleForm.date,
        start_time: rescheduleForm.start_time,
        end_time: rescheduleForm.end_time
      });
      alert('✅ Appointment rescheduled');
      fetchData();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to reschedule');
    }
  }

  async function handleAssignTherapist() {
    if (!assignForm.therapist_id) {
      alert('❌ Select a therapist');
      return;
    }

    try {
      await api.put(`/org-appointments/${assignForm.appointmentId}/assign-therapist`, {
        therapist_id: assignForm.therapist_id
      });
      alert('✅ Therapist assigned');
      fetchData();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to assign therapist');
    }
  }

  async function handleMarkCompleted(aptId) {
    try {
      await api.put(`/org-appointments/${aptId}/mark-completed`);
      alert('✅ Marked completed');
      fetchData();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to update');
    }
  }

  async function handleCancelAppointment() {
    if (!cancelForm.appointmentId) return;

    if (!window.confirm('⚠️ Cancel this appointment?')) return;

    try {
      await api.put(`/org-appointments/${cancelForm.appointmentId}/cancel`, {
        reason: cancelForm.reason || 'Cancelled by admin'
      });
      alert('✅ Appointment cancelled');
      fetchData();
      setCancelForm({ appointmentId: '', reason: '' });
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to cancel');
    }
  }

  async function handleDeleteAppointment(aptId) {
    if (!window.confirm('⚠️ Delete appointment permanently?')) return;

    try {
      await api.delete(`/org-appointments/${aptId}`);
      alert('✅ Appointment deleted');
      fetchData();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(0); }}
            className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'all' && '📅 All'}
            {tab === 'upcoming' && '⏰ Upcoming'}
            {tab === 'completed' && '✅ Completed'}
            {tab === 'cancelled' && '❌ Cancelled'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Appointments Management</h2>

        {loading ? (
          <div className="text-center py-8 text-slate-600">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-slate-600">No appointments found</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Therapist</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Parent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-medium">{apt.therapist_name}</td>
                    <td className="px-6 py-3 text-sm">{apt.parent_name}</td>
                    <td className="px-6 py-3 text-sm">{new Date(apt.appointment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">{apt.start_time || '—'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleViewDetails(apt.id)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
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

        {/* Pagination */}
        {appointments.length > 0 && (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-slate-600">Page {currentPage + 1}</span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={appointments.length < limit}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Therapist Schedules */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">👥 Therapist Schedules</h3>
        <div className="space-y-2">
          {therapists.map((t) => (
            <div key={t.id} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-600">
                  ⏰ {t.upcoming_count} upcoming | ✅ {t.completed_count} completed
                </p>
                {t.next_appointment && (
                  <p className="text-xs text-slate-500 mt-1">
                    Next: {new Date(t.next_appointment).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 my-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-slate-900">Appointment Details</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <p><span className="font-semibold">Therapist:</span> {selectedAppointment.therapist_name}</p>
              <p><span className="font-semibold">Parent:</span> {selectedAppointment.parent_name}</p>
              <p><span className="font-semibold">Email:</span> {selectedAppointment.parent_email}</p>
              <p><span className="font-semibold">Date:</span> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
              <p><span className="font-semibold">Time:</span> {selectedAppointment.start_time || '—'}</p>
              <p><span className="font-semibold">Status:</span> {selectedAppointment.status}</p>
            </div>

            {/* Assign Therapist */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Change Therapist</label>
              <select
                value={assignForm.therapist_id}
                onChange={(e) => setAssignForm({ ...assignForm, therapist_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select therapist...</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignTherapist}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Assign Therapist
              </button>
            </div>

            {/* Reschedule */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Reschedule</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="px-2 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="time"
                  value={rescheduleForm.start_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, start_time: e.target.value })}
                  className="px-2 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="time"
                  value={rescheduleForm.end_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, end_time: e.target.value })}
                  className="px-2 py-2 border border-slate-300 rounded text-sm"
                  placeholder="End"
                />
              </div>
              <button
                onClick={handleReschedule}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Reschedule
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {selectedAppointment.status !== 'completed' && (
                <button
                  onClick={() => handleMarkCompleted(selectedAppointment.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  ✅ Mark Completed
                </button>
              )}

              {selectedAppointment.status !== 'cancelled' && (
                <button
                  onClick={() => setCancelForm({ ...cancelForm, appointmentId: selectedAppointment.id })}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  🚫 Cancel
                </button>
              )}

              <button
                onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelForm.appointmentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
            <textarea
              value={cancelForm.reason}
              onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
              placeholder="Reason (optional)..."
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCancelAppointment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setCancelForm({ appointmentId: '', reason: '' })}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
