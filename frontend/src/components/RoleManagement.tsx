import React, { useState, useEffect } from 'react';
import { CooperativeRole, CooperativePermission } from '../types';
import { api } from '../utils/api';
import { 
  Shield, Key, Plus, Edit2, Trash, CheckSquare, Square, 
  X, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Layers, ShieldCheck, ShieldAlert, HelpCircle 
} from 'lucide-react';

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<CooperativeRole[]>([]);
  const [permissions, setPermissions] = useState<CooperativePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CooperativeRole | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
      ]);
      setRoles(rolesData || []);
      
      // Inject module groups for display if group is empty
      const normalizedPermissions = (permissionsData || []).map(p => {
        let group = p.group || 'General Module';
        if (p.name.startsWith('users:') || p.name.startsWith('roles:')) {
          group = 'Security & RBAC';
        } else if (p.name.startsWith('milk-') || p.name.startsWith('rates:')) {
          group = 'Cooperative Operations';
        } else if (p.name.startsWith('employees:')) {
          group = 'HR & Employees';
        } else if (p.name.startsWith('finance:')) {
          group = 'Financials & Billing';
        }
        return { ...p, group };
      });

      setPermissions(normalizedPermissions);
    } catch (err: any) {
      setError(err.message || 'Failed to pull roles/permissions records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group permissions by their respective group name
  const groupedPermissions = permissions.reduce((acc, p) => {
    const groupName = p.group || 'General Modules';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(p);
    return acc;
  }, {} as Record<string, CooperativePermission[]>);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Role Name is required.');
      setFormSubmitting(false);
      return;
    }

    try {
      await api.createRole({
        name: formData.name,
        description: formData.description,
        permissionIds: formData.permissionIds,
      });
      setSuccess(`Role '${formData.name.toUpperCase()}' generated with permission maps.`);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', permissionIds: [] });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create role.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditClick = (role: CooperativeRole) => {
    setEditingRole(role);
    setEditFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.rolePermissions.map(rp => rp.permissionId),
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      await api.updateRole(editingRole.id, {
        name: editFormData.name,
        description: editFormData.description,
        permissionIds: editFormData.permissionIds,
      });
      setSuccess(`Role '${editFormData.name.toUpperCase()}' configurations updated.`);
      setShowEditModal(false);
      setEditingRole(null);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update custom role.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: CooperativeRole) => {
    if (role.name === 'ADMIN') return;
    const count = role._count?.userRoles || 0;
    if (count > 0) {
      alert(`Safety Guard Blocked: Role '${role.name}' is currently assigned to ${count} active accounts. Demote those accounts first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently erase the custom role '${role.name}'?`)) {
      return;
    }

    try {
      await api.deleteRole(role.id);
      setSuccess(`Custom role '${role.name}' successfully purged.`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to purge role.');
    }
  };

  const togglePermissionInForm = (id: string, isEdit = false) => {
    if (isEdit) {
      const current = [...editFormData.permissionIds];
      const idx = current.indexOf(id);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(id);
      }
      setEditFormData({ ...editFormData, permissionIds: current });
    } else {
      const current = [...formData.permissionIds];
      const idx = current.indexOf(id);
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(id);
      }
      setFormData({ ...formData, permissionIds: current });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-extrabold text-gray-900">Roles & System Authorization Matrix</h2>
          </div>
          <p className="text-xs text-gray-400">
            Define security configurations, map access gates, and maintain role-based governance structures.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', permissionIds: [] });
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      {/* Action Toasts */}
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

      {/* Grid of Security Roles */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-400">Verifying role structures...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const isAdmin = role.name === 'ADMIN';
            const usersCount = role._count?.userRoles || 0;
            const mappedPermissions = role.rolePermissions.map(rp => rp.permission.name);

            return (
              <div 
                key={role.id} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition relative overflow-hidden ${
                  isAdmin 
                    ? 'border-purple-200 ring-1 ring-purple-100 bg-purple-50/10' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Visual Accent Badge */}
                {isAdmin && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-extrabold px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-xs">
                    Sovereign Account
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title Segment */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-purple-600' : 'text-teal-600'}`} />
                      <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight">{role.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 min-h-8 leading-relaxed">
                      {role.description || 'No specialized description provided for this profile.'}
                    </p>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/75 p-3 rounded-xl border border-slate-100/50 text-center">
                    <div>
                      <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Assigned staff</span>
                      <span className="text-sm font-black text-gray-800">{usersCount} accounts</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Auth Vectors</span>
                      <span className="text-sm font-black text-gray-800">
                        {isAdmin ? 'ALL PERMISSIONS' : `${role.rolePermissions.length} active`}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Summary Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Permissions whitelist:</span>
                    <div className="flex flex-wrap gap-1">
                      {isAdmin ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100">
                          * (Full Administrator Bypass)
                        </span>
                      ) : role.rolePermissions.length === 0 ? (
                        <span className="text-[10px] text-gray-400 italic">No permission gates mapped yet.</span>
                      ) : (
                        mappedPermissions.slice(0, 6).map((perm, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-mono font-medium border border-slate-200"
                          >
                            {perm}
                          </span>
                        ))
                      )}
                      {!isAdmin && role.rolePermissions.length > 6 && (
                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[9px] font-bold">
                          +{role.rolePermissions.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations Row */}
                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  {isAdmin ? (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold italic">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
                      System Protected Role
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(role)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 text-gray-600 hover:text-gray-900 text-xs font-bold rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Modify Vector
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 text-xs font-bold rounded-lg transition"
                        disabled={usersCount > 0}
                      >
                        <Trash className="w-3.5 h-3.5" />
                        Purge Role
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5 text-teal-600" />
                  Create Custom Security Role
                </h3>
                <p className="text-[10px] text-gray-400">Map specialized operational permissions</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Role Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. OPERATOR"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Operational Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Handles daily milk measurements, FAT/SNF tests..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Mapped Permissions list */}
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Map Permission Gates</h4>
                  <p className="text-[10px] text-gray-400">Select which capabilities this security role is whitelisted for.</p>
                </div>

                <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
                  {(Object.entries(groupedPermissions) as [string, CooperativePermission[]][]).map(([group, groupPerms]) => (
                    <div key={group} className="space-y-2">
                      <h5 className="text-[10px] font-black text-teal-800 uppercase tracking-widest border-b border-slate-100 pb-1">
                        {group}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupPerms.map((perm) => {
                          const isChecked = formData.permissionIds.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermissionInForm(perm.id, false)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-teal-50/50 border-teal-200 text-teal-900'
                                  : 'bg-slate-50/45 border-slate-150 hover:bg-slate-50 text-gray-700'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-teal-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-mono font-bold leading-none">{perm.name}</p>
                                <p className="text-[10px] text-gray-400 leading-tight">{perm.description || 'No details.'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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
                  {formSubmitting ? 'Creating...' : 'Create Custom Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOM ROLE MODAL */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-4.5 h-4.5 text-teal-600" />
                  Modify Role permissions mapping
                </h3>
                <p className="text-[10px] text-gray-400">Synchronize authorization properties for operational staff</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRole(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Role Identifier</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-gray-500 uppercase cursor-not-allowed outline-none"
                    readOnly
                    disabled
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Operational Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Handles daily milk measurements, FAT/SNF tests..."
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Mapped Permissions list */}
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Map Permission Gates</h4>
                  <p className="text-[10px] text-gray-400">Select which capabilities this security role is whitelisted for.</p>
                </div>

                <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
                  {(Object.entries(groupedPermissions) as [string, CooperativePermission[]][]).map(([group, groupPerms]) => (
                    <div key={group} className="space-y-2">
                      <h5 className="text-[10px] font-black text-teal-800 uppercase tracking-widest border-b border-slate-100 pb-1">
                        {group}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupPerms.map((perm) => {
                          const isChecked = editFormData.permissionIds.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermissionInForm(perm.id, true)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-teal-50/50 border-teal-200 text-teal-900'
                                  : 'bg-slate-50/45 border-slate-150 hover:bg-slate-50 text-gray-700'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-teal-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-mono font-bold leading-none">{perm.name}</p>
                                <p className="text-[10px] text-gray-400 leading-tight">{perm.description || 'No details.'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRole(null);
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
