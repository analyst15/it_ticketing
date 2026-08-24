import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  User,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  ShieldAlert,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

interface LoginPageProps {
  users: UserAccount[];
  onLogin: (user: UserAccount, targetPortal: 'admin' | 'employee') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Quick select category tab
  const [quickRoleTab, setQuickRoleTab] = useState<'admin' | 'it_staff' | 'employee'>('admin');

  // Handle Standard Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your workplace email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = email.trim().toLowerCase();
      const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!matchedUser) {
        setErrorMessage(`No account found with email "${email}". User accounts are created by IT Administrators. Please contact your IT administrator.`);
        return;
      }

      if (matchedUser.status === 'Inactive') {
        setErrorMessage('This user account is currently deactivated. Please contact IT Administration.');
        return;
      }

      const targetPortal: 'admin' | 'employee' = (matchedUser.role === 'Admin' || matchedUser.role === 'IT Staff') 
        ? 'admin' 
        : 'employee';

      onLogin(matchedUser, targetPortal);
    }, 350);
  };

  // Quick 1-Click Select Profile
  const handleQuickSelect = (user: UserAccount) => {
    setEmail(user.email);
    setPassword('••••••••');
    setErrorMessage('');
    
    const targetPortal: 'admin' | 'employee' = (user.role === 'Admin' || user.role === 'IT Staff')
      ? 'admin'
      : 'employee';
    onLogin(user, targetPortal);
  };

  // Filter users by role
  const adminUsers = users.filter(u => u.role === 'Admin');
  const itStaffUsers = users.filter(u => u.role === 'IT Staff');
  const employeeUsers = users.filter(u => u.role === 'Employee');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-xs">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/ilearn-cc226.firebasestorage.app/o/EWF%20Main.png?alt=media&token=3e05f629-7f10-44ba-a0a9-e901a63010c8"
                alt="Elimisha Watoto Foundation"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="border-l border-slate-700 pl-3">
              <div className="text-sm font-bold text-white leading-tight">Elimisha IT Desk</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Header: Sign In */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Account Sign In</h1>
              <p className="text-xs text-slate-500">Enter your organization credentials</p>
            </div>
          </div>

          {/* Error Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Authentication Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@company.com');
                      setPassword('admin123');
                    }}
                    className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    Admin
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('mike.rodriguez@company.com');
                      setPassword('staff123');
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    IT Staff
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('sarah.chen@company.com');
                      setPassword('staff123');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Employee
                  </button>
                </div>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="font-medium">Remember my session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-white bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Admin Provisioning Notice */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong className="text-slate-800">Admin Account Policy:</strong> User accounts are created and provisioned exclusively by IT Administrators.
            </span>
          </div>

          {/* Quick 1-Click Fast Selector with Role Categorization */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Click Test Profiles:
              </span>

              {/* Sub-tabs for quick profiles */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickRoleTab('admin')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    quickRoleTab === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IT Admin
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRoleTab('it_staff')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    quickRoleTab === 'it_staff' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IT Staff
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRoleTab('employee')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    quickRoleTab === 'employee' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Employees
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {quickRoleTab === 'admin' && (
                adminUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/90 border border-purple-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-bold text-purple-950 group-hover:text-purple-900 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-black">Admin</span>
                        </div>
                        <div className="text-[11px] text-purple-700 truncate">{u.email} • Full System Admin</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-700 group-hover:text-purple-900 shrink-0">
                      Sign In
                    </span>
                  </button>
                ))
              )}

              {quickRoleTab === 'it_staff' && (
                itStaffUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-sky-50/70 hover:bg-sky-100/90 border border-sky-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        <Headphones className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-bold text-sky-950 group-hover:text-sky-900 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-black">IT Staff</span>
                        </div>
                        <div className="text-[11px] text-sky-700 truncate">{u.email} • Support Technician</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-700 group-hover:text-sky-900 shrink-0">
                      Sign In
                    </span>
                  </button>
                ))
              )}

              {quickRoleTab === 'employee' && (
                employeeUsers.slice(0, 3).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {u.name[0]}
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-bold text-blue-950 group-hover:text-blue-900 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-bold">Staff</span>
                        </div>
                        <div className="text-[11px] text-blue-700 truncate">{u.department} • {u.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 group-hover:text-blue-900 shrink-0">
                      Sign In
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer info */}
          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Elimisha Watoto Foundation &copy; {new Date().getFullYear()}</span>
            <span>it@elimishawatoto.org</span>
          </div>
        </div>
      </main>
    </div>
  );
};



