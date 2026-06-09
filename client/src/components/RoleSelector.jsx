import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RoleSelector({ onRoleSelected }) {
  const { selectRole, loading } = useAuth();
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    type: 'therapy_center',
    location: '',
    email: ''
  });
  const [err, setErr] = useState('');

  const roles = [
    {
      id: 'parent',
      label: 'Parent / Guardian',
      icon: '',
      desc: 'Access resources and book therapies for your child'
    },
    {
      id: 'therapist',
      label: 'Therapist / Specialist',
      icon: '',
      desc: 'Manage client sessions and create treatment plans'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: '',
      desc: 'Manage platform and user accounts'
    },
    {
      id: 'organization_admin',
      label: 'Organization Manager',
      icon: '',
      desc: 'Manage therapy center or special education center'
    }
  ];

  async function handleRoleSelect(role) {
    if (role === 'organization_admin') {
      setShowOrgForm(true);
      return;
    }

    setErr('');
    const result = await selectRole(role);
    if (result.ok) {
      onRoleSelected?.();
    } else {
      setErr(result.error);
    }
  }

  async function handleCreateOrg(e) {
    e.preventDefault();
    setErr('');

    if (!orgForm.name || !orgForm.type) {
      setErr('Organization name and type are required');
      return;
    }

    const result = await selectRole('organization_admin', {
      orgName: orgForm.name,
      orgType: orgForm.type,
      orgLocation: orgForm.location,
      orgEmail: orgForm.email
    });

    if (result.ok) {
      onRoleSelected?.();
    } else {
      setErr(result.error);
    }
  }

  if (showOrgForm) {
    const orgTypes = [
      { value: 'therapy_center', label: 'Therapy Center' },
      { value: 'child_dev_center', label: 'Child Development Center' },
      { value: 'special_ed_center', label: 'Special Education Center' },
      { value: 'rehab_center', label: 'Rehabilitation Center' }
    ];

    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8">
          <button
            onClick={() => setShowOrgForm(false)}
            className="mb-6 text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
             Back to roles
          </button>

          <h2 className="text-2xl font-bold text-brand-600 mb-2">Create Organization</h2>
          <p className="text-slate-600 mb-6">Set up your therapy center or education facility</p>

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                placeholder="e.g., Rainbow Therapy Center"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Organization Type
              </label>
              <select
                value={orgForm.type}
                onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {orgTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location (Optional)
              </label>
              <input
                type="text"
                value={orgForm.location}
                onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })}
                placeholder="City or address"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email (Optional)
              </label>
              <input
                type="email"
                value={orgForm.email}
                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                placeholder="contact@organization.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-card p-8">
        <h2 className="text-3xl font-bold text-brand-600 mb-2">Select Your Role</h2>
        <p className="text-slate-600 mb-8">
          Choose how you'll use Asha (आशा)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              disabled={loading}
              className="p-6 border-2 border-slate-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition text-left disabled:opacity-60"
            >
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="font-bold text-slate-900 mb-1">{role.label}</h3>
              <p className="text-sm text-slate-600">{role.desc}</p>
            </button>
          ))}
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

        <p className="text-xs text-slate-500 text-center">
          You can change your role later in settings
        </p>
      </div>
    </div>
  );
}
