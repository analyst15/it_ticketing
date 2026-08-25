import React, { useState } from 'react';
import { UserAccount, UserRole, UserStatus, Ticket, ITAsset } from '../types';
import {
  Search,
  UserCheck,
  Plus,
  Users,
  Headphones,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Shield,
  Ticket as TicketIcon,
} from 'lucide-react';

interface UsersViewProps {
  users: UserAccount[];
  tickets: Ticket[];
  assets: ITAsset[];
  onSelectTicket: (ticket: Ticket) => void;
  onAddUser?: (user: Omit<UserAccount, 'id' | 'dateAdded'>) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onOpenCreateTicketForUser?: (userName: string, userEmail: string, department: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  tickets,
  assets,
  onSelectTicket,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onOpenCreateTicketForUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Employee' | 'IT Staff' | 'Admin'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    department: string;
    status: UserStatus;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Engineering',
    status: 'Active',
  });

  const [formError, setFormError] = useState('');

  // Calculate stats based on users array
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const itStaffCount = users.filter(u => u.role === 'IT Staff' || u.role === 'Admin').length;
  const employeesCount = users.filter(u => u.role === 'Employee').length;
  const departmentCount = new Set(users.map(u => u.department)).size;

  // Filter users list
  const filteredUsers = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'employee123',
      role: 'Employee',
      department: 'Engineering',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || (user.role === 'Admin' ? 'admin123' : user.role === 'IT Staff' ? 'staff123' : 'employee123'),
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Please enter a user name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.department.trim()) {
      setFormError('Please enter a department.');
      return;
    }
    if (formData.password && formData.password.trim().length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    const defaultPw = formData.role === 'Admin' ? 'admin123' : formData.role === 'IT Staff' ? 'staff123' : 'employee123';
    const finalPassword = formData.password?.trim() || defaultPw;

    if (editingUser && onUpdateUser) {
      onUpdateUser({
        ...editingUser,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: finalPassword,
        role: formData.role,
        department: formData.department.trim(),
        status: formData.status,
      });
    } else if (onAddUser) {
      onAddUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: finalPassword,
        role: formData.role,
        department: formData.department.trim(),
        status: formData.status,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDeleteUser) {
      onDeleteUser(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Staff Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employees, IT technicians, roles, and assigned workstations</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => {
            setRoleFilter('All');
            setStatusFilter('All');
          }}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'All' && statusFilter === 'All'
              ? 'border-blue-500/40 ring-2 ring-blue-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalUsersCount}</span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Across {departmentCount} departments</p>
        </div>

        {/* Active Users */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Active'
              ? 'border-emerald-500/40 ring-2 ring-emerald-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeUsersCount}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {Math.round((activeUsersCount / (totalUsersCount || 1)) * 100)}% active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Operational & active status</p>
        </div>

        {/* IT Staff */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'IT Staff' ? 'All' : 'IT Staff')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'IT Staff'
              ? 'border-blue-500/40 ring-2 ring-blue-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IT Staff</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{itStaffCount}</span>
            <span className="text-xs text-indigo-600 font-medium">Technicians</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Support & System Admins</p>
        </div>

        {/* Employees */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'Employee' ? 'All' : 'Employee')}
          className={`bg-white border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            roleFilter === 'Employee'
              ? 'border-blue-500/40 ring-2 ring-blue-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{employeesCount}</span>
            <span className="text-xs text-slate-500">Staff</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Standard organization users</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Employee', 'IT Staff', 'Admin'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRoleFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  roleFilter === tab
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Active', 'Inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table matching Screenshot */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  NAME
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ROLE
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  DEPARTMENT
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  DATE ADDED
                </th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-sm text-slate-900 whitespace-nowrap">
                      {user.name}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {user.role === 'Admin' && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          Admin
                        </span>
                      )}
                      {user.role === 'IT Staff' && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          IT Staff
                        </span>
                      )}
                      {user.role === 'Employee' && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Employee
                        </span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6 text-xs text-slate-700 whitespace-nowrap">
                      {user.department}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {user.status === 'Active' ? (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Date Added */}
                    <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap">
                      {user.dateAdded}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(user)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User Details' : 'Add New User'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sarah.chen@company.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="IT Staff">IT Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering, IT Support, Marketing"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="e.g. employee123"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default passwords: Admin (<code className="text-purple-600 font-bold">admin123</code>), IT Staff (<code className="text-sky-600 font-bold">staff123</code>), Employee (<code className="text-blue-600 font-bold">employee123</code>).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete User</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <strong className="text-slate-800 font-semibold">{deleteCandidate.name}</strong> ({deleteCandidate.email})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
