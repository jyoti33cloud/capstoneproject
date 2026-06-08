import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TherapistDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-600">Therapist Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Welcome, {user?.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Active Clients</h3>
            <p className="text-3xl font-bold text-brand-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Sessions This Week</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Treatment Plans</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming Sessions</h2>
          <div className="text-center text-slate-600 py-8">
            <p>No sessions scheduled</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-8">
          <h3 className="font-semibold text-blue-900 mb-2">🚀 Coming Soon</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Manage client sessions and schedules</li>
            <li>• Create and update treatment plans</li>
            <li>• Track client progress</li>
            <li>• Communicate with organization staff</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
