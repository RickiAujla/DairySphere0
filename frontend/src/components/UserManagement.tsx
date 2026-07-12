import React, { useState, useEffect } from 'react';
import { CooperativeUser, CooperativeRole } from '../types';
import { api, ApiError } from '../utils/api';
import { 
  Users, UserPlus, Search, Shield, Activity, Key, Edit, Trash2, 
  Check, X, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, ChevronRight, UserCheck, ShieldAlert 
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<CooperativeUser[]>([]);
  const [roles, setRoles] = useState<CooperativeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal / Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CooperativeUser | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load cooperative users & roles
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getUsers({
          search: search || undefined,
          roleId: roleFilter || undefined,
          status: statusFilter || undefined,
        }),
        api.getRoles()
      ]);
      setUsers(usersData.users || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    // Form client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.roleId) {
      setFormError('All fields must be filled.');
      setFormSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      setFormSubmitting(false);
      return;
    }

    try {
      await api.createUser(formData);
      setSuccess('User profile created and configured successfully.');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', roleId: '' });
      await loadData();
      
      // Auto dismiss success toast after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditClick = (user: CooperativeUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.role?.id || '',
      isActive: user.isActive,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormSubmitting(true);
    setFormError(null);

    // Validate DTO
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      setFormError('Name and Email are required.');
      setFormSubmitting(false);
      return;
    }

    if (editFormData.password && editFormData.password.length < 8) {
      setFormError('Password must be at least 8 characters if provided.');
      setFormSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: editFormData.name,
        email: editFormData.email,
        roleId: editFormData.roleId || undefined,
        isActive: editFormData.isActive,
      };
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      await api.updateUser(editingUser.id, payload);
      setSuccess(`User profile metadata for ${editFormData.name} synchronized.`);
      setShowEditModal(false);
      setEditingUser(null);
      await loadData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user profile properties.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: CooperativeUser) => {
    if (!window.confirm(`Are you absolutely sure you want to deactivate and archive ${user.name}?`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      setSuccess(`User account ${user.name} deactivated.`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed due to administrative safeguard guards.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Context Branding Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-extrabold text-gray-900">User Management</h2>
          </div>
          <p className="text-xs text-gray-400">
            Provision staff profiles, assign roles, and audit access permissions in this tenant sub-schema.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      {/* Success/Error Toasts */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={loadData} className="p-1 hover:bg-rose-100 rounded-md">
            <RefreshCw className="w-3.5 h-3.5 text-rose-700" />
          </button>
        </div>
      )}

      {/* Search and Filters Segment */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by full name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 transition"
          >
            <option value="">All Cooperative Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 transition"
          >
            <option value="active">Active Accounts Only</option>
            <option value="inactive">Archived / Deactivated</option>
            <option value="">All Status Levels</option>
          </select>
        </div>
      </div>

      {/* Database Listing Grid/Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold text-gray-400 tracking-tight">Syncing cooperative directory records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center px-4">
            <Users className="w-10 h-10 text-gray-300" />
            <p className="text-xs font-extrabold text-gray-500">No Cooperative Users Found</p>
            <p className="text-[11px] text-gray-400 max-w-sm">
              We couldn't locate any accounts matching your specified parameters. Clear the filters or provision a new user.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Account Details</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Assigned Role</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => {
                  const roleName = user.role?.name || 'NO ROLE';
                  const isAdminRole = roleName === 'ADMIN';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-800">{user.name}</p>
                          <p className="text-[11px] text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-tight uppercase ${
                          isAdminRole 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-medium text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-500 hover:text-gray-800 transition"
                            title="Edit User Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition"
                            title="Archive / Deactivate Profile"
                            disabled={!user.isActive}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-4.5 h-4.5 text-teal-600" />
                  Provision Staff Profile
                </h3>
                <p className="text-[10px] text-gray-400">Generate fresh cooperative profile credentials</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. anand@dairysphere.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assigned Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                >
                  <option value="" disabled>Select Role Mapping...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-bold text-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Edit className="w-4.5 h-4.5 text-teal-600" />
                  Synchronize User profile
                </h3>
                <p className="text-[10px] text-gray-400">Update credentials, status levels, or roles</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Change Password</label>
                  <span className="text-[9px] text-gray-400 lowercase italic">leave blank to keep current</span>
                </div>
                <input
                  type="password"
                  placeholder="New strong password (min 8 chars)"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assigned Role</label>
                <select
                  value={editFormData.roleId}
                  onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
                <label htmlFor="userActiveCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Account is Active and authorized to log in
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-bold text-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Synchronizing...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
