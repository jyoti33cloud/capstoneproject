import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Platform Management • {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Key Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Organizations</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Therapists</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Active Sessions</h3>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">User Management</h2>
          <div className="text-center text-slate-600 py-8">
            <p>User list coming soon</p>
          </div>
        </div>

        {/* Admin Features */}
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">⚙️ Admin Features (Coming Soon)</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Manage all users and roles</li>
            <li>• Monitor organizations and therapists</li>
            <li>• View platform analytics</li>
            <li>• Manage content and resources</li>
            <li>• Handle reports and support tickets</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
