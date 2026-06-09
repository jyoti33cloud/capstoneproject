import { useState, useEffect } from 'react';
import api from '../api';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('view');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'parent',
    city: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    city: ''
  });

  // Role change state
  const [roleChangeForm, setRoleChangeForm] = useState({
    role: '',
    searchUser: ''
  });

  // Password reset
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    if (activeTab === 'view') {
      fetchUsers();
    }
  }, [activeTab, searchTerm, roleFilter, currentPage]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', currentPage * limit);
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const { data } = await api.get(`/admin/users/all?${params}`);
      setUsers(data.users);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('❌ Name, email, and password required');
      return;
    }

    try {
      const { data } = await api.post('/admin/users/create', createForm);
      alert('✅ User created successfully: ' + data.user.email);
      setCreateForm({ name: '', email: '', password: '', role: 'parent', city: '' });
      setActiveTab('view');
      fetchUsers();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to create user'));
    }
  }

  async function handleViewProfile(userId) {
    try {
      const { data } = await api.get(`/admin/users/${userId}/profile`);
      setSelectedUser(data.user);
      setEditForm({
        name: data.user.name,
        email: data.user.email,
        city: data.user.city || ''
      });
    } catch (err) {
      alert('❌ Failed to load user profile');
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return;

    try {
      const { data } = await api.put(`/admin/users/${selectedUser.id}/update`, editForm);
      alert('✅ User updated successfully');
      setSelectedUser(data.user);
      fetchUsers();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Failed to update user'));
    }
  }

  async function handleChangeRole(userId, newRole) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('✅ User role changed to: ' + newRole);
      fetchUsers();
    } catch (err) {
      alert('❌ Failed to change role');
    }
  }

  async function handleResetPassword(userId) {
    try {
      const { data } = await api.put(`/admin/users/${userId}/reset-password`);
      setResetPasswordUser(data.user);
      setTempPassword(data.temporary_password);
      alert('✅ Password reset. Share temporary password: ' + data.temporary_password);
    } catch (err) {
      alert('❌ Failed to reset password');
    }
  }

  async function handleDeactivateUser(userId) {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      alert('✅ User deactivated');
      fetchUsers();
    } catch (err) {
      alert('❌ Failed to deactivate user');
    }
  }

  async function handleActivateUser(userId) {
    try {
      await api.put(`/admin/users/${userId}/activate`);
      alert('✅ User activated');
      fetchUsers();
    } catch (err) {
      alert('❌ Failed to activate user');
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('⚠️ Are you sure? This will PERMANENTLY DELETE the user!')) return;
    try {
      await api.delete(`/admin/users/${userId}/delete`);
      alert('✅ User permanently deleted');
      fetchUsers();
    } catch (err) {
      alert('❌ Failed to delete user');
    }
  }

  async function handleSoftDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to soft delete this user?')) return;
    try {
      await api.put(`/admin/users/${userId}/soft-delete`);
      alert('✅ User soft deleted');
      fetchUsers();
    } catch (err) {
      alert('❌ Failed to soft delete user');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('view'); setSelectedUser(null); }}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'view'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 View All Users
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          ➕ Create User
        </button>
        <button
          onClick={() => setActiveTab('role-change')}
          className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'role-change'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          🔄 Change Role
        </button>
      </div>

      {/* VIEW ALL USERS TAB */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🔍 Search by Name or Email
              </label>
              <input
                type="text"
                placeholder="Type name or email..."
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
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="parent">Parent</option>
                <option value="therapist">Therapist</option>
                <option value="admin">Admin</option>
                <option value="organization_admin">Organization Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No users found</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">City</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900">{user.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{user.city || '—'}</td>
                      <td className="px-6 py-3 text-sm space-y-2">
                        <button
                          onClick={() => handleViewProfile(user.id)}
                          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          👁️ View Profile
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="block w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                        >
                          🔑 Reset Password
                        </button>
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          className="block w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                        >
                          ⏸️ Deactivate
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="block w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 text-slate-600">
                Page {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={users.length < limit}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}

          {/* User Profile Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Edit User Profile</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateUser}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    💾 Save Changes
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE USER TAB */}
      {activeTab === 'create' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">➕ Create New User</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">👤 Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">📧 Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔐 Password (min 6 chars)</label>
            <input
              type="password"
              placeholder="Enter secure password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">👥 User Role</label>
            <div className="space-y-2">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="parent"
                    checked={createForm.role === 'parent'}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  />
                  <span className="text-sm text-slate-700">Parent / User</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="therapist"
                    checked={createForm.role === 'therapist'}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  />
                  <span className="text-sm text-slate-700">Therapist / Specialist</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="organization_admin"
                    checked={createForm.role === 'organization_admin'}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  />
                  <span className="text-sm text-slate-700">Organization / Center Admin</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={createForm.role === 'admin'}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  />
                  <span className="text-sm text-slate-700">Platform Admin</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🏙️ City (Optional)</label>
            <input
              type="text"
              placeholder="Mumbai, Delhi, etc."
              value={createForm.city}
              onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleCreateUser}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            ✅ Create User Account
          </button>
        </div>
      )}

      {/* CHANGE ROLE TAB */}
      {activeTab === 'role-change' && (
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">🔄 Change User Role</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">🔍 Find User</label>
            <input
              type="text"
              placeholder="Type user name or email..."
              value={roleChangeForm.searchUser}
              onChange={(e) => setRoleChangeForm({ ...roleChangeForm, searchUser: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {roleChangeForm.searchUser && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {users
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(roleChangeForm.searchUser.toLowerCase()) ||
                    u.email.toLowerCase().includes(roleChangeForm.searchUser.toLowerCase())
                )
                .map((user) => (
                  <div key={user.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-600">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setRoleChangeForm({ ...roleChangeForm, userId: user.id });
                        setRoleChangeForm({ ...roleChangeForm, searchUser: '' });
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          )}

          {roleChangeForm.userId && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  Selected: {users.find((u) => u.id === roleChangeForm.userId)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Role</label>
                <div className="space-y-2">
                  {['parent', 'therapist', 'organization_admin', 'admin'].map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="new_role"
                        value={role}
                        checked={roleChangeForm.role === role}
                        onChange={(e) => setRoleChangeForm({ ...roleChangeForm, role: e.target.value })}
                      />
                      <span className="text-sm text-slate-700 capitalize">{role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  handleChangeRole(roleChangeForm.userId, roleChangeForm.role);
                  setRoleChangeForm({ searchUser: '', userId: null, role: '' });
                }}
                disabled={!roleChangeForm.role}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                ✅ Update Role
              </button>

              <button
                onClick={() => setRoleChangeForm({ searchUser: '', userId: null, role: '' })}
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
