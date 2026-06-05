import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useLang } from '../context/LangContext';

export default function AdminTherapists() {
  const { getPendingTherapists, verifyTherapist, rejectTherapist, loading } = useAdmin();
  const { t } = useLang();
  const [therapists, setTherapists] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadTherapists();
  }, [activeTab]);

  async function loadTherapists() {
    const data = await getPendingTherapists();
    setTherapists(data || []);
  }

  async function handleVerify(id) {
    const result = await verifyTherapist(id);
    if (result) {
      setTherapists(therapists.filter(t => t.id !== id));
    }
  }

  async function handleReject(id) {
    const result = await rejectTherapist(id, rejectReason);
    if (result) {
      setTherapists(therapists.filter(t => t.id !== id));
      setSelectedTherapist(null);
      setRejectReason('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Therapist Verification</h1>
        <p className="text-slate-600">Review and verify therapist applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === 'pending'
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Pending ({therapists.length})
        </button>
      </div>

      {/* Therapists List */}
      <div className="space-y-4">
        {therapists.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-slate-600">No pending therapist applications</div>
          </div>
        ) : (
          therapists.map((therapist) => (
            <div key={therapist.id} className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{therapist.name}</h3>
                  <p className="text-sm text-slate-600">{therapist.specialist_type}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-slate-600 mb-1">Email</div>
                  <div className="font-medium text-slate-900">{therapist.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 mb-1">Phone</div>
                  <div className="font-medium text-slate-900">{therapist.contact_phone}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-600 mb-1">Location</div>
                  <div className="font-medium text-slate-900">{therapist.location}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-600 mb-1">Applied</div>
                  <div className="font-medium text-slate-900">
                    {new Date(therapist.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify(therapist.id)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                >
                  ✓ Verify
                </button>
                <button
                  onClick={() => setSelectedTherapist(therapist)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {selectedTherapist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Reject {selectedTherapist.name}?
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-slate-200 rounded-lg p-3 mb-4 text-sm resize-none"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTherapist(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedTherapist.id)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
