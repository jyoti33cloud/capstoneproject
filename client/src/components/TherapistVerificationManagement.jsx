import { useState, useEffect } from 'react';
import api from '../api';

export default function TherapistVerificationManagement() {
  const [activeTab, setActiveTab] = useState('view-applications');
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Add therapist form
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    specializations: '',
    years_experience: '',
    consultation_fee: '',
    bio: '',
    city: ''
  });

  // Approval form
  const [approvalForm, setApprovalForm] = useState({
    therapistId: '',
    therapistSearch: '',
    approval_notes: ''
  });

  // Rejection form
  const [rejectionForm, setRejectionForm] = useState({
    therapistId: '',
    therapistSearch: '',
    rejection_reason: ''
  });

  // Request documents form
  const [requestDocsForm, setRequestDocsForm] = useState({
    therapistId: '',
    therapistSearch: '',
    document_types: [],
    message: ''
  });

  // Revoke verification form
  const [revokeForm, setRevokeForm] = useState({
    therapistId: '',
    therapistSearch: '',
    revocation_reason: ''
  });

  useEffect(() => {
    fetchTherapists();
  }, [activeTab, searchTerm, statusFilter, currentPage]);

  async function fetchTherapists() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);
      params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const { data } = await api.get(`/admin/therapist-verification/applications?${params}`);
      setTherapists(data.applications);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch therapists:', err);
      setLoading(false);
    }
  }

  async function handleViewProfile(therapistId) {
    try {
      const { data } = await api.get(`/admin/therapist-verification/${therapistId}/profile`);
      setSelectedTherapist(data);
    } catch (err) {
      alert('❌ Failed to load therapist profile');
    }
  }

  async function handleAddTherapistManually() {
    if (!addForm.name || !addForm.email || !addForm.specializations) {
      alert('❌ Name, email, and specializations required');
      return;
    }

    try {
      const { data } = await api.post('/admin/therapist-verification/add-manually', addForm);
      alert('✅ Therapist added: ' + data.therapist.name);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        specializations: '',
        years_experience: '',
        consultation_fee: '',
        bio: '',
        city: ''
      });
      setActiveTab('view-applications');
      fetchTherapists();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to add therapist'));
    }
  }

  async function handleApproveTherapist() {
    if (!approvalForm.therapistId) {
      alert('❌ Please select a therapist');
      return;
    }

    try {
      const { data } = await api.put(
        `/admin/therapist-verification/${approvalForm.therapistId}/approve`,
        { approval_notes: approvalForm.approval_notes }
      );
      alert('✅ Therapist approved: ' + data.message);
      setApprovalForm({ therapistId: '', therapistSearch: '', approval_notes: '' });
      fetchTherapists();
    } catch (err) {
      alert('❌ Failed to approve therapist');
    }
  }

  async function handleRejectTherapist() {
    if (!rejectionForm.therapistId || !rejectionForm.rejection_reason) {
      alert('❌ Please select a therapist and provide rejection reason');
      return;
    }

    try {
      const { data } = await api.put(
        `/admin/therapist-verification/${rejectionForm.therapistId}/reject`,
        { rejection_reason: rejectionForm.rejection_reason }
      );
      alert('✅ Therapist rejected');
      setRejectionForm({ therapistId: '', therapistSearch: '', rejection_reason: '' });
      fetchTherapists();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to reject therapist'));
    }
  }

  async function handleRequestDocuments() {
    if (!requestDocsForm.therapistId || requestDocsForm.document_types.length === 0) {
      alert('❌ Please select a therapist and at least one document type');
      return;
    }

    try {
      await api.put(
        `/admin/therapist-verification/${requestDocsForm.therapistId}/request-documents`,
        {
          document_types: requestDocsForm.document_types,
          message: requestDocsForm.message
        }
      );
      alert('✅ Document request sent to therapist');
      setRequestDocsForm({ therapistId: '', therapistSearch: '', document_types: [], message: '' });
      fetchTherapists();
    } catch (err) {
      alert('❌ Failed to request documents');
    }
  }

  async function handleRevokeVerification() {
    if (!revokeForm.therapistId) {
      alert('❌ Please select a therapist');
      return;
    }

    if (!window.confirm('⚠️ Are you sure? This will revoke the therapist\'s verification!')) {
      return;
    }

    try {
      await api.put(
        `/admin/therapist-verification/${revokeForm.therapistId}/revoke-verification`,
        { revocation_reason: revokeForm.revocation_reason }
      );
      alert('✅ Verification revoked');
      setRevokeForm({ therapistId: '', therapistSearch: '', revocation_reason: '' });
      fetchTherapists();
    } catch (err) {
      alert('❌ Failed to revoke verification');
    }
  }

  async function handleRemoveTherapistListing(therapistId) {
    if (!window.confirm('⚠️ Are you sure? This will remove the therapist from the platform!')) {
      return;
    }

    try {
      await api.delete(`/admin/therapist-verification/${therapistId}/remove-listing`);
      alert('✅ Therapist listing removed');
      setSelectedTherapist(null);
      fetchTherapists();
    } catch (err) {
      alert('❌ Failed to remove therapist');
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_documents: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      revoked: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('view-applications'); setSelectedTherapist(null); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'view-applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Applications
        </button>
        <button
          onClick={() => setActiveTab('add-manually')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'add-manually'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ➕ Add Manually
        </button>
        <button
          onClick={() => setActiveTab('approve')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'approve'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ✅ Approve
        </button>
        <button
          onClick={() => setActiveTab('reject')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'reject'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ❌ Reject
        </button>
        <button
          onClick={() => setActiveTab('request-docs')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'request-docs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📄 Request Docs
        </button>
        <button
          onClick={() => setActiveTab('revoke')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'revoke'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          🚫 Revoke
        </button>
      </div>

      {/* VIEW APPLICATIONS TAB */}
      {activeTab === 'view-applications' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Therapist Verification Applications</h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🔍 Search by Name or Email
              </label>
              <input
                type="text"
                placeholder="Type therapist name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="pending_documents">Pending Documents</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Status</option>
              </select>
            </div>
          </div>

          {/* Therapists Table */}
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading therapists...</div>
          ) : therapists.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No therapists found</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Specialization</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Documents</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {therapists.map((therapist) => (
                    <tr key={therapist.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900 font-medium">{therapist.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{therapist.email}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{therapist.specializations || '—'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(therapist.verification_status)}`}>
                          {therapist.verification_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="font-bold text-blue-600">{therapist.document_count || 0}</span>
                      </td>
                      <td className="px-6 py-3 text-sm space-y-2">
                        <button
                          onClick={() => handleViewProfile(therapist.id)}
                          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          👁️ View Full Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {therapists.length > 0 && (
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
                disabled={therapists.length < limit}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}

          {/* Therapist Profile Modal */}
          {selectedTherapist && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-6 my-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Therapist Profile</h3>
                  <button
                    onClick={() => setSelectedTherapist(null)}
                    className="text-2xl text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-3">👤 Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Name</p>
                      <p className="font-semibold text-slate-900">{selectedTherapist.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{selectedTherapist.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">City</p>
                      <p className="font-semibold text-slate-900">{selectedTherapist.user.city || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Status</p>
                      <p className={`font-semibold px-2 py-1 rounded text-xs ${getStatusColor(selectedTherapist.profile?.verification_status)}`}>
                        {selectedTherapist.profile?.verification_status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                {selectedTherapist.profile && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3">💼 Professional Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600">Specializations</p>
                        <p className="font-semibold text-slate-900">{selectedTherapist.profile.specializations || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Years Experience</p>
                        <p className="font-semibold text-slate-900">{selectedTherapist.profile.years_experience || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Consultation Fee</p>
                        <p className="font-semibold text-slate-900">₹{selectedTherapist.profile.consultation_fee || '—'}</p>
                      </div>
                    </div>
                    {selectedTherapist.profile.bio && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-600">Bio</p>
                        <p className="text-sm text-slate-700 line-clamp-3">{selectedTherapist.profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents */}
                {selectedTherapist.documents && selectedTherapist.documents.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3">📄 Uploaded Documents ({selectedTherapist.documents.length})</h4>
                    <div className="space-y-2">
                      {selectedTherapist.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900 capitalize">{doc.document_type}</p>
                            <p className="text-xs text-slate-600">
                              {doc.status} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            📥 View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qualifications */}
                {selectedTherapist.qualifications && selectedTherapist.qualifications.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3">🎓 Qualifications ({selectedTherapist.qualifications.length})</h4>
                    <div className="space-y-2">
                      {selectedTherapist.qualifications.map((qual) => (
                        <div key={qual.id} className="bg-white p-3 rounded border border-slate-200">
                          <p className="font-semibold text-slate-900">{qual.qualification_title}</p>
                          <p className="text-sm text-slate-600">{qual.institution}</p>
                          <p className="text-xs text-slate-500">{new Date(qual.completion_date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedTherapist.profile?.admin_notes && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-900 mb-2">📝 Admin Notes</h4>
                    <p className="text-sm text-yellow-800">{selectedTherapist.profile.admin_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {selectedTherapist.profile?.verification_status !== 'approved' && (
                    <button
                      onClick={() => {
                        setApprovalForm({ ...approvalForm, therapistId: selectedTherapist.user.id });
                        setActiveTab('approve');
                        setSelectedTherapist(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      ✅ Approve
                    </button>
                  )}
                  {selectedTherapist.profile?.verification_status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectionForm({ ...rejectionForm, therapistId: selectedTherapist.user.id });
                        setActiveTab('reject');
                        setSelectedTherapist(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      ❌ Reject
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRequestDocsForm({ ...requestDocsForm, therapistId: selectedTherapist.user.id });
                      setActiveTab('request-docs');
                      setSelectedTherapist(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    📄 Request Docs
                  </button>
                  {selectedTherapist.profile?.verification_status === 'approved' && (
                    <button
                      onClick={() => {
                        setRevokeForm({ ...revokeForm, therapistId: selectedTherapist.user.id });
                        setActiveTab('revoke');
                        setSelectedTherapist(null);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                    >
                      🚫 Revoke
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveTherapistListing(selectedTherapist.user.id)}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition text-sm"
                  >
                    🗑️ Remove Listing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD THERAPIST MANUALLY TAB */}
      {activeTab === 'add-manually' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">➕ Add Therapist Manually</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">👤 Full Name</label>
              <input
                type="text"
                placeholder="Dr. John Smith"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📧 Email</label>
              <input
                type="email"
                placeholder="doctor@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📱 Phone (Optional)</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📍 City (Optional)</label>
              <input
                type="text"
                placeholder="Mumbai"
                value={addForm.city}
                onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">🎓 Specializations</label>
              <input
                type="text"
                placeholder="Speech Therapy, Autism Spectrum Disorder"
                value={addForm.specializations}
                onChange={(e) => setAddForm({ ...addForm, specializations: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">📅 Years Experience</label>
              <input
                type="number"
                placeholder="5"
                value={addForm.years_experience}
                onChange={(e) => setAddForm({ ...addForm, years_experience: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">💰 Consultation Fee (₹)</label>
              <input
                type="number"
                placeholder="500"
                value={addForm.consultation_fee}
                onChange={(e) => setAddForm({ ...addForm, consultation_fee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">📝 Bio (Optional)</label>
            <textarea
              placeholder="Brief professional bio..."
              value={addForm.bio}
              onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAddTherapistManually}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            ✅ Add Therapist
          </button>
        </div>
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">✅ Approve Therapist</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔍 Find Therapist</label>
            <input
              type="text"
              placeholder="Type therapist name or email..."
              value={approvalForm.therapistSearch}
              onChange={(e) => setApprovalForm({ ...approvalForm, therapistSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {approvalForm.therapistSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {therapists
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(approvalForm.therapistSearch.toLowerCase()) ||
                    t.email.toLowerCase().includes(approvalForm.therapistSearch.toLowerCase())
                )
                .map((therapist) => (
                  <div key={therapist.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{therapist.name}</p>
                      <p className="text-xs text-slate-600">{therapist.email}</p>
                    </div>
                    <button
                      onClick={() => setApprovalForm({ ...approvalForm, therapistId: therapist.id, therapistSearch: '' })}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {approvalForm.therapistId && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  Selected: {therapists.find((t) => t.id === approvalForm.therapistId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">📝 Approval Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes about this approval..."
                  value={approvalForm.approval_notes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approval_notes: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleApproveTherapist}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                ✅ Approve Therapist
              </button>

              <button
                onClick={() => setApprovalForm({ therapistId: '', therapistSearch: '', approval_notes: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                ✕ Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* REJECT TAB */}
      {activeTab === 'reject' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">❌ Reject Therapist</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔍 Find Therapist</label>
            <input
              type="text"
              placeholder="Type therapist name or email..."
              value={rejectionForm.therapistSearch}
              onChange={(e) => setRejectionForm({ ...rejectionForm, therapistSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {rejectionForm.therapistSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {therapists
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(rejectionForm.therapistSearch.toLowerCase()) ||
                    t.email.toLowerCase().includes(rejectionForm.therapistSearch.toLowerCase())
                )
                .map((therapist) => (
                  <div key={therapist.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{therapist.name}</p>
                      <p className="text-xs text-slate-600">{therapist.email}</p>
                    </div>
                    <button
                      onClick={() => setRejectionForm({ ...rejectionForm, therapistId: therapist.id, therapistSearch: '' })}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {rejectionForm.therapistId && (
            <>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900">
                  Selected: {therapists.find((t) => t.id === rejectionForm.therapistId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">⚠️ Rejection Reason</label>
                <textarea
                  placeholder="Explain why this therapist is being rejected..."
                  value={rejectionForm.rejection_reason}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, rejection_reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRejectTherapist}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                ❌ Reject Therapist
              </button>

              <button
                onClick={() => setRejectionForm({ therapistId: '', therapistSearch: '', rejection_reason: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                ✕ Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* REQUEST DOCUMENTS TAB */}
      {activeTab === 'request-docs' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">📄 Request Additional Documents</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔍 Find Therapist</label>
            <input
              type="text"
              placeholder="Type therapist name or email..."
              value={requestDocsForm.therapistSearch}
              onChange={(e) => setRequestDocsForm({ ...requestDocsForm, therapistSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {requestDocsForm.therapistSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {therapists
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(requestDocsForm.therapistSearch.toLowerCase()) ||
                    t.email.toLowerCase().includes(requestDocsForm.therapistSearch.toLowerCase())
                )
                .map((therapist) => (
                  <div key={therapist.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{therapist.name}</p>
                      <p className="text-xs text-slate-600">{therapist.email}</p>
                    </div>
                    <button
                      onClick={() => setRequestDocsForm({ ...requestDocsForm, therapistId: therapist.id, therapistSearch: '' })}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {requestDocsForm.therapistId && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  Selected: {therapists.find((t) => t.id === requestDocsForm.therapistId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">📄 Document Types Needed</label>
                <div className="space-y-2">
                  {['license', 'certificate', 'degree', 'registration', 'other'].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={requestDocsForm.document_types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequestDocsForm({
                              ...requestDocsForm,
                              document_types: [...requestDocsForm.document_types, type]
                            });
                          } else {
                            setRequestDocsForm({
                              ...requestDocsForm,
                              document_types: requestDocsForm.document_types.filter((d) => d !== type)
                            });
                          }
                        }}
                      />
                      <span className="text-sm text-slate-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">💬 Message (Optional)</label>
                <textarea
                  placeholder="Additional message to therapist..."
                  value={requestDocsForm.message}
                  onChange={(e) => setRequestDocsForm({ ...requestDocsForm, message: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRequestDocuments}
                disabled={requestDocsForm.document_types.length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                📄 Request Documents
              </button>

              <button
                onClick={() => setRequestDocsForm({ therapistId: '', therapistSearch: '', document_types: [], message: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                ✕ Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* REVOKE TAB */}
      {activeTab === 'revoke' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">🚫 Revoke Verification</h2>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-800">⚠️ This will revoke the therapist's verification. They will need to reapply.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔍 Find Therapist</label>
            <input
              type="text"
              placeholder="Type therapist name or email..."
              value={revokeForm.therapistSearch}
              onChange={(e) => setRevokeForm({ ...revokeForm, therapistSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {revokeForm.therapistSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {therapists
                .filter(
                  (t) =>
                    t.name.toLowerCase().includes(revokeForm.therapistSearch.toLowerCase()) ||
                    t.email.toLowerCase().includes(revokeForm.therapistSearch.toLowerCase())
                )
                .map((therapist) => (
                  <div key={therapist.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{therapist.name}</p>
                      <p className="text-xs text-slate-600">{therapist.email}</p>
                    </div>
                    <button
                      onClick={() => setRevokeForm({ ...revokeForm, therapistId: therapist.id, therapistSearch: '' })}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {revokeForm.therapistId && (
            <>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900">
                  Selected: {therapists.find((t) => t.id === revokeForm.therapistId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">⚠️ Revocation Reason</label>
                <textarea
                  placeholder="Explain why verification is being revoked..."
                  value={revokeForm.revocation_reason}
                  onChange={(e) => setRevokeForm({ ...revokeForm, revocation_reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRevokeVerification}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                🚫 Revoke Verification
              </button>

              <button
                onClick={() => setRevokeForm({ therapistId: '', therapistSearch: '', revocation_reason: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                ✕ Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
