import { useState, useEffect } from 'react';
import api from '../api';

export default function OrganizationVerificationManagement() {
  const [activeTab, setActiveTab] = useState('view-applications');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Add organization form
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'therapy_center',
    email: '',
    phone_1: '',
    location: '',
    city: '',
    state: '',
    website: '',
    specializations: ''
  });

  // Approval form
  const [approvalForm, setApprovalForm] = useState({
    orgId: '',
    orgSearch: '',
    approval_notes: ''
  });

  // Rejection form
  const [rejectionForm, setRejectionForm] = useState({
    orgId: '',
    orgSearch: '',
    rejection_reason: ''
  });

  // Update form
  const [updateForm, setUpdateForm] = useState({
    orgId: '',
    orgSearch: '',
    name: '',
    type: '',
    email: '',
    phone_1: '',
    location: '',
    city: '',
    state: '',
    website: '',
    specializations: ''
  });

  // Suspend form
  const [suspendForm, setSuspendForm] = useState({
    orgId: '',
    orgSearch: '',
    suspension_reason: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, [activeTab, searchTerm, statusFilter, currentPage]);

  async function fetchOrganizations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);
      params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const { data } = await api.get(`/admin/organization-verification/applications?${params}`);
      setOrganizations(data.applications);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setLoading(false);
    }
  }

  async function handleViewProfile(orgId) {
    try {
      const { data } = await api.get(`/admin/organization-verification/${orgId}/profile`);
      setSelectedOrganization(data);
    } catch (err) {
      alert(' Failed to load organization profile');
    }
  }

  async function handleAddOrganization() {
    if (!addForm.name || !addForm.type || !addForm.email || !addForm.location) {
      alert(' Name, type, email, and location required');
      return;
    }

    try {
      const { data } = await api.post('/admin/organization-verification/add', addForm);
      alert(' Organization added: ' + data.organization.name);
      setAddForm({
        name: '',
        type: 'therapy_center',
        email: '',
        phone_1: '',
        location: '',
        city: '',
        state: '',
        website: '',
        specializations: ''
      });
      setActiveTab('view-applications');
      fetchOrganizations();
    } catch (err) {
      alert(' ' + (err.response?.data?.error || 'Failed to add organization'));
    }
  }

  async function handleApproveOrganization() {
    if (!approvalForm.orgId) {
      alert(' Please select an organization');
      return;
    }

    try {
      await api.put(
        `/admin/organization-verification/${approvalForm.orgId}/approve`,
        { approval_notes: approvalForm.approval_notes }
      );
      alert(' Organization approved');
      setApprovalForm({ orgId: '', orgSearch: '', approval_notes: '' });
      fetchOrganizations();
    } catch (err) {
      alert(' Failed to approve organization');
    }
  }

  async function handleRejectOrganization() {
    if (!rejectionForm.orgId || !rejectionForm.rejection_reason) {
      alert(' Please select an organization and provide rejection reason');
      return;
    }

    try {
      await api.put(
        `/admin/organization-verification/${rejectionForm.orgId}/reject`,
        { rejection_reason: rejectionForm.rejection_reason }
      );
      alert(' Organization rejected');
      setRejectionForm({ orgId: '', orgSearch: '', rejection_reason: '' });
      fetchOrganizations();
    } catch (err) {
      alert(' Failed to reject organization');
    }
  }

  async function handleUpdateOrganization() {
    if (!updateForm.orgId) {
      alert(' Please select an organization');
      return;
    }

    try {
      const updateData = {};
      if (updateForm.name) updateData.name = updateForm.name;
      if (updateForm.type) updateData.type = updateForm.type;
      if (updateForm.location) updateData.location = updateForm.location;
      if (updateForm.city) updateData.city = updateForm.city;
      if (updateForm.state) updateData.state = updateForm.state;
      if (updateForm.email) updateData.email = updateForm.email;
      if (updateForm.phone_1) updateData.phone_1 = updateForm.phone_1;
      if (updateForm.website) updateData.website = updateForm.website;
      if (updateForm.specializations) updateData.specializations = updateForm.specializations;

      await api.put(
        `/admin/organization-verification/${updateForm.orgId}/update`,
        updateData
      );
      alert(' Organization updated');
      setUpdateForm({
        orgId: '',
        orgSearch: '',
        name: '',
        type: '',
        email: '',
        phone_1: '',
        location: '',
        city: '',
        state: '',
        website: '',
        specializations: ''
      });
      fetchOrganizations();
    } catch (err) {
      alert(' Failed to update organization');
    }
  }

  async function handleSuspendOrganization() {
    if (!suspendForm.orgId) {
      alert(' Please select an organization');
      return;
    }

    if (!window.confirm(' Are you sure? This will suspend the organization!')) {
      return;
    }

    try {
      await api.put(
        `/admin/organization-verification/${suspendForm.orgId}/suspend`,
        { suspension_reason: suspendForm.suspension_reason }
      );
      alert(' Organization suspended');
      setSuspendForm({ orgId: '', orgSearch: '', suspension_reason: '' });
      fetchOrganizations();
    } catch (err) {
      alert(' Failed to suspend organization');
    }
  }

  async function handleRemoveOrganization(orgId) {
    if (!window.confirm(' Are you sure? This will PERMANENTLY remove the organization!')) {
      return;
    }

    try {
      await api.delete(`/admin/organization-verification/${orgId}/remove`);
      alert(' Organization removed');
      setSelectedOrganization(null);
      fetchOrganizations();
    } catch (err) {
      alert(' Failed to remove organization');
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      therapy_center: 'Therapy Center',
      child_development_center: 'Child Development Center',
      special_education_center: 'Special Education Center',
      rehabilitation_center: 'Rehabilitation Center'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('view-applications'); setSelectedOrganization(null); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'view-applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Applications
        </button>
        <button
          onClick={() => setActiveTab('add-organization')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'add-organization'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Add Organization
        </button>
        <button
          onClick={() => setActiveTab('approve')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'approve'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Approve
        </button>
        <button
          onClick={() => setActiveTab('reject')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'reject'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Reject
        </button>
        <button
          onClick={() => setActiveTab('update')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'update'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
           Update Info
        </button>
        <button
          onClick={() => setActiveTab('suspend')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'suspend'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ⏸ Suspend
        </button>
      </div>

      {/* VIEW APPLICATIONS TAB */}
      {activeTab === 'view-applications' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Organization Verification Applications</h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                 Search by Name or Email
              </label>
              <input
                type="text"
                placeholder="Type organization name or email..."
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
                <option value="all">All Status</option>
              </select>
            </div>
          </div>

          {/* Organizations Table */}
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading organizations...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No organizations found</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Documents</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900 font-medium">{org.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{getTypeLabel(org.type)}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{org.email || ''}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{org.location || ''}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(org.verification_status)}`}>
                          {org.verification_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="font-bold text-blue-600">{org.document_count || 0}</span>
                      </td>
                      <td className="px-6 py-3 text-sm space-y-2">
                        <button
                          onClick={() => handleViewProfile(org.id)}
                          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                           View Full Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {organizations.length > 0 && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                 Previous
              </button>
              <span className="px-4 py-2 text-slate-600">Page {currentPage + 1}</span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={organizations.length < limit}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                Next 
              </button>
            </div>
          )}

          {/* Organization Profile Modal */}
          {selectedOrganization && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg max-w-3xl w-full p-6 space-y-6 my-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Organization Profile</h3>
                  <button
                    onClick={() => setSelectedOrganization(null)}
                    className="text-2xl text-slate-400 hover:text-slate-600"
                  >
                    
                  </button>
                </div>

                {/* Organization Info */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-3"> Organization Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Name</p>
                      <p className="font-semibold text-slate-900">{selectedOrganization.organization.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Type</p>
                      <p className="font-semibold text-slate-900">{getTypeLabel(selectedOrganization.organization.type)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Location</p>
                      <p className="font-semibold text-slate-900">{selectedOrganization.organization.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">City / State</p>
                      <p className="font-semibold text-slate-900">
                        {selectedOrganization.organization.city}, {selectedOrganization.organization.state || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {selectedOrganization.details && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3"> Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="font-semibold text-slate-900">{selectedOrganization.details.email || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Phone</p>
                        <p className="font-semibold text-slate-900">{selectedOrganization.details.phone_1 || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Website</p>
                        <p className="font-semibold text-slate-900">{selectedOrganization.details.website || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Status</p>
                        <p className={`font-semibold px-2 py-1 rounded text-xs ${getStatusColor(selectedOrganization.details.verification_status)}`}>
                          {selectedOrganization.details.verification_status}
                        </p>
                      </div>
                    </div>
                    {selectedOrganization.details.specializations && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-600">Specializations</p>
                        <p className="text-sm text-slate-700">{selectedOrganization.details.specializations}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents */}
                {selectedOrganization.documents && selectedOrganization.documents.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3"> Registration Documents ({selectedOrganization.documents.length})</h4>
                    <div className="space-y-2">
                      {selectedOrganization.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-900 capitalize">{doc.document_type}</p>
                            <p className="text-xs text-slate-600">
                              {doc.status} {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                             View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {selectedOrganization.services && selectedOrganization.services.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3"> Services Offered ({selectedOrganization.services.length})</h4>
                    <div className="space-y-2">
                      {selectedOrganization.services.map((service) => (
                        <div key={service.id} className="bg-white p-3 rounded border border-slate-200">
                          <p className="font-semibold text-slate-900">{service.service_name}</p>
                          {service.description && (
                            <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedOrganization.details?.approval_notes && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-2"> Approval Notes</h4>
                    <p className="text-sm text-green-800">{selectedOrganization.details.approval_notes}</p>
                  </div>
                )}

                {selectedOrganization.details?.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-bold text-red-900 mb-2"> Rejection Reason</h4>
                    <p className="text-sm text-red-800">{selectedOrganization.details.rejection_reason}</p>
                  </div>
                )}

                {selectedOrganization.details?.suspension_reason && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-bold text-orange-900 mb-2">⏸ Suspension Reason</h4>
                    <p className="text-sm text-orange-800">{selectedOrganization.details.suspension_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {selectedOrganization.details?.verification_status !== 'approved' && (
                    <button
                      onClick={() => {
                        setApprovalForm({ ...approvalForm, orgId: selectedOrganization.organization.id });
                        setActiveTab('approve');
                        setSelectedOrganization(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                       Approve
                    </button>
                  )}
                  {selectedOrganization.details?.verification_status !== 'rejected' && (
                    <button
                      onClick={() => {
                        setRejectionForm({ ...rejectionForm, orgId: selectedOrganization.organization.id });
                        setActiveTab('reject');
                        setSelectedOrganization(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                       Reject
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUpdateForm({
                        ...updateForm,
                        orgId: selectedOrganization.organization.id,
                        name: selectedOrganization.organization.name,
                        type: selectedOrganization.organization.type
                      });
                      setActiveTab('update');
                      setSelectedOrganization(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                     Update Info
                  </button>
                  {selectedOrganization.details?.verification_status !== 'suspended' && (
                    <button
                      onClick={() => {
                        setSuspendForm({ ...suspendForm, orgId: selectedOrganization.organization.id });
                        setActiveTab('suspend');
                        setSelectedOrganization(null);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                    >
                      ⏸ Suspend
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveOrganization(selectedOrganization.organization.id)}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition text-sm"
                  >
                     Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD ORGANIZATION TAB */}
      {activeTab === 'add-organization' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Add Organization</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Organization Name</label>
              <input
                type="text"
                placeholder="ABC Therapy Center"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Organization Type</label>
              <select
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="therapy_center">Therapy Center</option>
                <option value="child_development_center">Child Development Center</option>
                <option value="special_education_center">Special Education Center</option>
                <option value="rehabilitation_center">Rehabilitation Center</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Email</label>
              <input
                type="email"
                placeholder="contact@therapycenter.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Phone (Optional)</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={addForm.phone_1}
                onChange={(e) => setAddForm({ ...addForm, phone_1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Location (Address)</label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={addForm.location}
                onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> City</label>
              <input
                type="text"
                placeholder="Mumbai"
                value={addForm.city}
                onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> State (Optional)</label>
              <input
                type="text"
                placeholder="Maharashtra"
                value={addForm.state}
                onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2"> Website (Optional)</label>
              <input
                type="text"
                placeholder="https://therapycenter.com"
                value={addForm.website}
                onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Specializations (Optional)</label>
            <input
              type="text"
              placeholder="Speech Therapy, Occupational Therapy, Special Education"
              value={addForm.specializations}
              onChange={(e) => setAddForm({ ...addForm, specializations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleAddOrganization}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
             Add Organization
          </button>
        </div>
      )}

      {/* APPROVE TAB */}
      {activeTab === 'approve' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Approve Organization</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Organization</label>
            <input
              type="text"
              placeholder="Type organization name or email..."
              value={approvalForm.orgSearch}
              onChange={(e) => setApprovalForm({ ...approvalForm, orgSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {approvalForm.orgSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {organizations
                .filter(
                  (o) =>
                    o.name.toLowerCase().includes(approvalForm.orgSearch.toLowerCase()) ||
                    o.email?.toLowerCase().includes(approvalForm.orgSearch.toLowerCase())
                )
                .map((org) => (
                  <div key={org.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-600">{org.email}</p>
                    </div>
                    <button
                      onClick={() => setApprovalForm({ ...approvalForm, orgId: org.id, orgSearch: '' })}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {approvalForm.orgId && (
            <>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  Selected: {organizations.find((o) => o.id === approvalForm.orgId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"> Approval Notes (Optional)</label>
                <textarea
                  placeholder="Add any notes about this approval..."
                  value={approvalForm.approval_notes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approval_notes: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleApproveOrganization}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                 Approve Organization
              </button>

              <button
                onClick={() => setApprovalForm({ orgId: '', orgSearch: '', approval_notes: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                 Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* REJECT TAB */}
      {activeTab === 'reject' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Reject Organization</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Organization</label>
            <input
              type="text"
              placeholder="Type organization name or email..."
              value={rejectionForm.orgSearch}
              onChange={(e) => setRejectionForm({ ...rejectionForm, orgSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {rejectionForm.orgSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {organizations
                .filter(
                  (o) =>
                    o.name.toLowerCase().includes(rejectionForm.orgSearch.toLowerCase()) ||
                    o.email?.toLowerCase().includes(rejectionForm.orgSearch.toLowerCase())
                )
                .map((org) => (
                  <div key={org.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-600">{org.email}</p>
                    </div>
                    <button
                      onClick={() => setRejectionForm({ ...rejectionForm, orgId: org.id, orgSearch: '' })}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {rejectionForm.orgId && (
            <>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900">
                  Selected: {organizations.find((o) => o.id === rejectionForm.orgId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"> Rejection Reason</label>
                <textarea
                  placeholder="Explain why this organization is being rejected..."
                  value={rejectionForm.rejection_reason}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, rejection_reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRejectOrganization}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                 Reject Organization
              </button>

              <button
                onClick={() => setRejectionForm({ orgId: '', orgSearch: '', rejection_reason: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                 Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* UPDATE TAB */}
      {activeTab === 'update' && (
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900"> Update Organization Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Organization</label>
            <input
              type="text"
              placeholder="Type organization name or email..."
              value={updateForm.orgSearch}
              onChange={(e) => setUpdateForm({ ...updateForm, orgSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {updateForm.orgSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {organizations
                .filter(
                  (o) =>
                    o.name.toLowerCase().includes(updateForm.orgSearch.toLowerCase()) ||
                    o.email?.toLowerCase().includes(updateForm.orgSearch.toLowerCase())
                )
                .map((org) => (
                  <div key={org.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-600">{org.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUpdateForm({
                          ...updateForm,
                          orgId: org.id,
                          orgSearch: '',
                          name: org.name,
                          type: org.type,
                          email: org.email,
                          phone_1: org.phone_1 || '',
                          location: org.location || '',
                          city: org.city || '',
                          state: org.state || '',
                          website: org.website || '',
                          specializations: org.specializations || ''
                        });
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {updateForm.orgId && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  Selected: {organizations.find((o) => o.id === updateForm.orgId)?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={updateForm.type}
                    onChange={(e) => setUpdateForm({ ...updateForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="therapy_center">Therapy Center</option>
                    <option value="child_development_center">Child Development Center</option>
                    <option value="special_education_center">Special Education Center</option>
                    <option value="rehabilitation_center">Rehabilitation Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={updateForm.phone_1}
                    onChange={(e) => setUpdateForm({ ...updateForm, phone_1: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={updateForm.location}
                    onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={updateForm.city}
                    onChange={(e) => setUpdateForm({ ...updateForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={updateForm.state}
                    onChange={(e) => setUpdateForm({ ...updateForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input
                    type="text"
                    value={updateForm.website}
                    onChange={(e) => setUpdateForm({ ...updateForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Specializations</label>
                <input
                  type="text"
                  value={updateForm.specializations}
                  onChange={(e) => setUpdateForm({ ...updateForm, specializations: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleUpdateOrganization}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                 Update Organization
              </button>

              <button
                onClick={() => setUpdateForm({
                  orgId: '',
                  orgSearch: '',
                  name: '',
                  type: '',
                  email: '',
                  phone_1: '',
                  location: '',
                  city: '',
                  state: '',
                  website: '',
                  specializations: ''
                })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                 Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* SUSPEND TAB */}
      {activeTab === 'suspend' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">⏸ Suspend Organization</h2>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <p className="text-sm text-orange-800"> This will suspend the organization. They cannot take appointments until unsuspended.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2"> Find Organization</label>
            <input
              type="text"
              placeholder="Type organization name or email..."
              value={suspendForm.orgSearch}
              onChange={(e) => setSuspendForm({ ...suspendForm, orgSearch: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {suspendForm.orgSearch && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {organizations
                .filter(
                  (o) =>
                    o.name.toLowerCase().includes(suspendForm.orgSearch.toLowerCase()) ||
                    o.email?.toLowerCase().includes(suspendForm.orgSearch.toLowerCase())
                )
                .map((org) => (
                  <div key={org.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-600">{org.email}</p>
                    </div>
                    <button
                      onClick={() => setSuspendForm({ ...suspendForm, orgId: org.id, orgSearch: '' })}
                      className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {suspendForm.orgId && (
            <>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-orange-900">
                  Selected: {organizations.find((o) => o.id === suspendForm.orgId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"> Suspension Reason (Optional)</label>
                <textarea
                  placeholder="Explain why the organization is being suspended..."
                  value={suspendForm.suspension_reason}
                  onChange={(e) => setSuspendForm({ ...suspendForm, suspension_reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSuspendOrganization}
                className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
              >
                ⏸ Suspend Organization
              </button>

              <button
                onClick={() => setSuspendForm({ orgId: '', orgSearch: '', suspension_reason: '' })}
                className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
              >
                 Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
