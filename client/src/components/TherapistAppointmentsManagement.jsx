import { useState, useEffect } from 'react';
import api from '../api';

export default function TherapistAppointmentsManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Reschedule form
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentId: '',
    appointment_date: '',
    start_time: '',
    end_time: ''
  });

  // Notes form
  const [notesForm, setNotesForm] = useState({
    appointmentId: '',
    notes: ''
  });

  // Reject/Cancel form
  const [reasonForm, setReasonForm] = useState({
    appointmentId: '',
    reason: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [activeTab, currentPage]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      const { data } = await api.get(`/therapist/appointments/all?${params}`);
      setAppointments(data.appointments);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setLoading(false);
    }
  }

  async function handleViewDetails(appointmentId) {
    try {
      const { data } = await api.get(`/therapist/appointments/${appointmentId}/details`);
      setSelectedAppointment(data);
      setNotesForm({ appointmentId, notes: data.notes?.notes || '' });
    } catch (err) {
      alert('❌ Failed to load appointment details');
    }
  }

  async function handleAcceptAppointment(appointmentId) {
    try {
      await api.put(`/therapist/appointments/${appointmentId}/accept`);
      alert('✅ Appointment accepted');
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to accept appointment');
    }
  }

  async function handleRejectAppointment() {
    if (!reasonForm.appointmentId) {
      alert('❌ Please select an appointment');
      return;
    }

    try {
      await api.put(
        `/therapist/appointments/${reasonForm.appointmentId}/reject`,
        { reason: reasonForm.reason || 'Rejected by therapist' }
      );
      alert('✅ Appointment rejected');
      fetchAppointments();
      setReasonForm({ appointmentId: '', reason: '' });
    } catch (err) {
      alert('❌ Failed to reject appointment');
    }
  }

  async function handleRescheduleAppointment() {
    if (!rescheduleForm.appointmentId || !rescheduleForm.appointment_date || !rescheduleForm.start_time) {
      alert('❌ Please fill in all required fields');
      return;
    }

    try {
      await api.put(
        `/therapist/appointments/${rescheduleForm.appointmentId}/reschedule`,
        {
          appointment_date: rescheduleForm.appointment_date,
          start_time: rescheduleForm.start_time,
          end_time: rescheduleForm.end_time || null
        }
      );
      alert('✅ Appointment rescheduled');
      fetchAppointments();
      setRescheduleForm({ appointmentId: '', appointment_date: '', start_time: '', end_time: '' });
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to reschedule appointment');
    }
  }

  async function handleMarkCompleted(appointmentId) {
    try {
      await api.put(`/therapist/appointments/${appointmentId}/complete`);
      alert('✅ Appointment marked as completed');
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to mark appointment completed');
    }
  }

  async function handleSaveNotes() {
    if (!notesForm.appointmentId || !notesForm.notes) {
      alert('❌ Please add notes');
      return;
    }

    try {
      await api.put(
        `/therapist/appointments/${notesForm.appointmentId}/notes`,
        { notes: notesForm.notes }
      );
      alert('✅ Notes saved');
      fetchAppointments();
      setSelectedAppointment(null);
      setNotesForm({ appointmentId: '', notes: '' });
    } catch (err) {
      alert('❌ Failed to save notes');
    }
  }

  async function handleCancelAppointment() {
    if (!reasonForm.appointmentId) {
      alert('❌ Please select an appointment');
      return;
    }

    if (!window.confirm('⚠️ Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await api.put(
        `/therapist/appointments/${reasonForm.appointmentId}/cancel`,
        { reason: reasonForm.reason || 'Cancelled by therapist' }
      );
      alert('✅ Appointment cancelled');
      fetchAppointments();
      setReasonForm({ appointmentId: '', reason: '' });
      setSelectedAppointment(null);
    } catch (err) {
      alert('❌ Failed to cancel appointment');
    }
  }

  async function handleSendReminder(appointmentId) {
    try {
      const { data } = await api.post(`/therapist/appointments/${appointmentId}/send-reminder`);
      alert('✅ ' + data.message);
    } catch (err) {
      alert('❌ Failed to send reminder');
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Pending',
      confirmed: '✅ Confirmed',
      completed: '✔️ Completed',
      cancelled: '❌ Cancelled'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(0); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 All Appointments
        </button>
        <button
          onClick={() => { setActiveTab('pending'); setCurrentPage(0); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ⏳ Pending
        </button>
        <button
          onClick={() => { setActiveTab('confirmed'); setCurrentPage(0); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'confirmed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ✅ Confirmed
        </button>
        <button
          onClick={() => { setActiveTab('completed'); setCurrentPage(0); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'completed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ✔️ Completed
        </button>
        <button
          onClick={() => { setActiveTab('cancelled'); setCurrentPage(0); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'cancelled'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ❌ Cancelled
        </button>
      </div>

      {/* Appointments Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Appointments Management</h2>

        {loading ? (
          <div className="text-center py-8 text-slate-600">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-slate-600">No appointments found</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Parent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium">{apt.parent_name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {new Date(apt.appointment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{apt.start_time || '—'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm space-y-2">
                      <button
                        onClick={() => handleViewDetails(apt.id)}
                        className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        👁️ View Details
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
              ← Previous
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

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-6 my-4">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold text-slate-900">Appointment Details</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Appointment Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-bold text-slate-900 mb-3">📅 Appointment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Parent</p>
                  <p className="font-semibold text-slate-900">{selectedAppointment.appointment.parent_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">{selectedAppointment.appointment.parent_email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(selectedAppointment.appointment.appointment_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Time</p>
                  <p className="font-semibold text-slate-900">{selectedAppointment.appointment.start_time || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600">Status</p>
                  <p className={`font-semibold px-3 py-1 rounded-full text-sm w-fit ${getStatusColor(selectedAppointment.appointment.status)}`}>
                    {getStatusLabel(selectedAppointment.appointment.status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-bold text-slate-900 mb-3">📝 Appointment Notes</h4>
              <textarea
                value={notesForm.notes}
                onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value, appointmentId: selectedAppointment.appointment.id })}
                placeholder="Add notes about this session..."
                rows="4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reschedule Form */}
            {selectedAppointment.appointment.status !== 'cancelled' && selectedAppointment.appointment.status !== 'completed' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-slate-900 mb-3">🔄 Reschedule Appointment</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Date</label>
                    <input
                      type="date"
                      value={rescheduleForm.appointment_date}
                      onChange={(e) => setRescheduleForm({
                        ...rescheduleForm,
                        appointmentId: selectedAppointment.appointment.id,
                        appointment_date: e.target.value
                      })}
                      className="w-full px-2 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={rescheduleForm.start_time}
                      onChange={(e) => setRescheduleForm({
                        ...rescheduleForm,
                        appointmentId: selectedAppointment.appointment.id,
                        start_time: e.target.value
                      })}
                      className="w-full px-2 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time (Optional)</label>
                    <input
                      type="time"
                      value={rescheduleForm.end_time}
                      onChange={(e) => setRescheduleForm({
                        ...rescheduleForm,
                        appointmentId: selectedAppointment.appointment.id,
                        end_time: e.target.value
                      })}
                      className="w-full px-2 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {selectedAppointment.appointment.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAcceptAppointment(selectedAppointment.appointment.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => setReasonForm({ ...reasonForm, appointmentId: selectedAppointment.appointment.id })}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    ❌ Reject
                  </button>
                </>
              )}

              {selectedAppointment.appointment.status !== 'cancelled' && selectedAppointment.appointment.status !== 'completed' && (
                <>
                  <button
                    onClick={handleRescheduleAppointment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    🔄 Reschedule
                  </button>
                  <button
                    onClick={() => handleSendReminder(selectedAppointment.appointment.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    🔔 Send Reminder
                  </button>
                </>
              )}

              {selectedAppointment.appointment.status === 'confirmed' && (
                <button
                  onClick={() => handleMarkCompleted(selectedAppointment.appointment.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  ✔️ Mark Completed
                </button>
              )}

              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm"
              >
                💾 Save Notes
              </button>

              {selectedAppointment.appointment.status !== 'cancelled' && (
                <button
                  onClick={() => setReasonForm({ ...reasonForm, appointmentId: selectedAppointment.appointment.id })}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                >
                  🗑️ Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject/Cancel Modal */}
      {reasonForm.appointmentId && !selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Reason</h3>
            <textarea
              value={reasonForm.reason}
              onChange={(e) => setReasonForm({ ...reasonForm, reason: e.target.value })}
              placeholder="Enter reason..."
              rows="4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRejectAppointment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                ❌ Reject/Cancel
              </button>
              <button
                onClick={() => setReasonForm({ appointmentId: '', reason: '' })}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
