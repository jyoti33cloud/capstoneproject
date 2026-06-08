import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function OrgAdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-600">Organization Manager</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your therapy center • {user?.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Organization Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Staff Members</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Active Clients</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">This Month Sessions</h3>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Organization Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Organization Name</label>
              <p className="text-slate-900">Not loaded</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Organization Type</label>
              <p className="text-slate-900">Not loaded</p>
            </div>
          </div>
        </div>

        {/* Staff Management */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Staff Members</h2>
          <div className="text-center text-slate-600 py-8">
            <p>Staff list coming soon</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">🏥 Organization Features (Coming Soon)</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Manage organization profile and settings</li>
            <li>• Invite and manage therapists</li>
            <li>• View client schedules and sessions</li>
            <li>• Generate reports and analytics</li>
            <li>• Manage billing and subscriptions</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
