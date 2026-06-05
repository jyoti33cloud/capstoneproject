import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useLang } from '../context/LangContext';

export default function AdminUsers() {
  const { getUsers, banUser, unbanUser, loading } = useAdmin();
  const { t } = useLang();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const data = await getUsers();
    setUsers(data || []);
  }

  async function handleBan(id) {
    const result = await banUser(id, banReason);
    if (result) {
      setUsers(users.map(u => u.id === id ? { ...u, banned: true } : u));
      setSelectedUser(null);
      setBanReason('');
    }
  }

  async function handleUnban(id) {
    const result = await unbanUser(id);
    if (result) {
      setUsers(users.map(u => u.id === id ? { ...u, banned: false } : u));
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
        <p className="text-slate-600">View and manage platform users</p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.banned ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.banned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-red-600 hover:text-red-700 font-semibold text-xs"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center text-slate-600">
            No users found
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Ban {selectedUser.name}?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              This user will be unable to access the platform.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (optional)"
              className="w-full border border-slate-200 rounded-lg p-3 mb-4 text-sm resize-none"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBan(selectedUser.id)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
