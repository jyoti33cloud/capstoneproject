import { useState, useEffect } from 'react';
import api from '../api';

export default function OrgEventsManagement() {
  const [activeTab, setActiveTab] = useState('view');
  const [eventType, setEventType] = useState('all');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Create forms
  const [createForm, setCreateForm] = useState({
    type: 'event',
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    capacity: 50,
    is_paid: false,
    amount: 0,
    trainer: '',
    campaign_type: '',
    topic: ''
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    eventId: '',
    title: '',
    description: '',
    location: '',
    capacity: '',
    is_paid: false,
    amount: 0
  });

  // Reschedule form
  const [rescheduleForm, setRescheduleForm] = useState({
    eventId: '',
    event_date: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [eventType, currentPage]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);
      if (eventType !== 'all') {
        params.append('event_type', eventType);
      }

      const { data } = await api.get(`/org-events/all?${params}`);
      setEvents(data.events);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setLoading(false);
    }
  }

  async function handleCreateEvent() {
    if (!createForm.title || !createForm.event_date) {
      alert('❌ Title and date required');
      return;
    }

    try {
      let endpoint = '/org-events/create';
      let payload = { ...createForm };

      if (createForm.type === 'workshop') {
        endpoint = '/org-events/create-workshop';
      } else if (createForm.type === 'campaign') {
        endpoint = '/org-events/create-campaign';
      } else if (createForm.type === 'training') {
        endpoint = '/org-events/create-training';
      }

      await api.post(endpoint, payload);
      alert('✅ Event created successfully');
      setCreateForm({
        type: 'event',
        title: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        capacity: 50,
        is_paid: false,
        amount: 0,
        trainer: '',
        campaign_type: '',
        topic: ''
      });
      setActiveTab('view');
      fetchEvents();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to create event'));
    }
  }

  async function handleViewDetails(eventId) {
    try {
      const eventsRes = await api.get('/org-events/all?limit=1');
      const event = events.find(e => e.id === eventId);
      setSelectedEvent(event);

      const regsRes = await api.get(`/org-events/${eventId}/registrations`);
      setRegistrations(regsRes.data.registrations);

      setEditForm({
        eventId,
        title: event.title,
        description: event.description,
        location: event.location,
        capacity: event.capacity,
        is_paid: event.is_paid,
        amount: event.amount
      });

      setRescheduleForm({
        eventId,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time
      });
    } catch (err) {
      alert('❌ Failed to load event details');
    }
  }

  async function handleEditEvent() {
    try {
      await api.put(`/org-events/${editForm.eventId}/edit`, {
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        capacity: editForm.capacity,
        is_paid: editForm.is_paid,
        amount: editForm.amount
      });
      alert('✅ Event updated');
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('❌ Failed to update event');
    }
  }

  async function handleReschedule() {
    if (!rescheduleForm.event_date) {
      alert('❌ Date required');
      return;
    }

    try {
      await api.put(`/org-events/${rescheduleForm.eventId}/reschedule`, {
        event_date: rescheduleForm.event_date,
        start_time: rescheduleForm.start_time,
        end_time: rescheduleForm.end_time
      });
      alert('✅ Event rescheduled');
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('❌ Failed to reschedule');
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm('⚠️ Delete this event? All registrations will be removed.')) return;

    try {
      await api.delete(`/org-events/${eventId}`);
      alert('✅ Event cancelled');
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('❌ Failed to delete event');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'view'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 View Events
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ➕ Create Event
        </button>
      </div>

      {/* VIEW EVENTS TAB */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Events & Workshops</h2>
            <select
              value={eventType}
              onChange={(e) => { setEventType(e.target.value); setCurrentPage(0); }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="event">Events</option>
              <option value="workshop">Workshops</option>
              <option value="awareness_campaign">Awareness Campaigns</option>
              <option value="parent_training">Parent Training</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No events found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition cursor-pointer" onClick={() => handleViewDetails(event.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 flex-1">{event.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded font-semibold whitespace-nowrap ml-2 ${
                      event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'today' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{event.description?.substring(0, 80)}...</p>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600">📅 {new Date(event.event_date).toLocaleDateString()}</p>
                    {event.start_time && <p className="text-slate-600">⏰ {event.start_time}</p>}
                    {event.location && <p className="text-slate-600">📍 {event.location}</p>}
                    <p className="text-slate-600">👥 Capacity: {event.capacity} | Registered: {event.registration_count}</p>
                    {event.is_paid && <p className="text-green-600 font-semibold">💰 ${event.amount}</p>}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(event.id);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {events.length > 0 && (
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
                disabled={events.length < limit}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE EVENT TAB */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Create Event</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="event">Event</option>
              <option value="workshop">Workshop</option>
              <option value="campaign">Awareness Campaign</option>
              <option value="training">Parent Training Session</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                placeholder="Event title..."
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Date *</label>
              <input
                type="date"
                value={createForm.event_date}
                onChange={(e) => setCreateForm({ ...createForm, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              placeholder="Event description..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
              <input
                type="time"
                value={createForm.start_time}
                onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
              <input
                type="time"
                value={createForm.end_time}
                onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="Event location..."
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {(createForm.type === 'workshop' || createForm.type === 'training') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trainer/Facilitator</label>
              <input
                type="text"
                placeholder="Trainer name..."
                value={createForm.trainer}
                onChange={(e) => setCreateForm({ ...createForm, trainer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
              <input
                type="number"
                value={createForm.capacity}
                onChange={(e) => setCreateForm({ ...createForm, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-7">
                <input
                  type="checkbox"
                  checked={createForm.is_paid}
                  onChange={(e) => setCreateForm({ ...createForm, is_paid: e.target.checked })}
                  className="rounded"
                />
                Paid Event
              </label>
            </div>
          </div>

          {createForm.is_paid && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
              <input
                type="number"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          )}

          <button
            onClick={handleCreateEvent}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            ✅ Create Event
          </button>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 my-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <p><span className="font-semibold">Type:</span> {selectedEvent.event_type}</p>
              <p><span className="font-semibold">Date:</span> {new Date(selectedEvent.event_date).toLocaleDateString()}</p>
              {selectedEvent.start_time && <p><span className="font-semibold">Time:</span> {selectedEvent.start_time}</p>}
              {selectedEvent.location && <p><span className="font-semibold">Location:</span> {selectedEvent.location}</p>}
              <p><span className="font-semibold">Status:</span> {selectedEvent.status}</p>
              <p><span className="font-semibold">Capacity:</span> {selectedEvent.capacity} (Registered: {selectedEvent.registration_count})</p>
              {selectedEvent.is_paid && <p><span className="font-semibold text-green-600">Amount:</span> ${selectedEvent.amount}</p>}
            </div>

            {selectedEvent.description && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-700">{selectedEvent.description}</p>
              </div>
            )}

            {/* Edit Fields */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-slate-900">Edit Event</h4>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Title"
              />
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Location"
              />
              <input
                type="number"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Capacity"
              />
            </div>

            {/* Reschedule */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-slate-900">Reschedule Event</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={rescheduleForm.event_date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, event_date: e.target.value })}
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
                />
              </div>
            </div>

            {/* Registrations */}
            {registrations.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Registrations ({registrations.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{reg.name}</p>
                        <p className="text-xs text-slate-600">{reg.email}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(reg.registration_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap border-t pt-4">
              <button
                onClick={handleEditEvent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                💾 Save Changes
              </button>
              <button
                onClick={handleReschedule}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                📅 Reschedule
              </button>
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                🗑️ Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
