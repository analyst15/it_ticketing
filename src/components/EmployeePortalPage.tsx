import React, { useState, useMemo, useEffect } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  KBArticle,
  ITAsset,
  UserAccount,
  TicketComment,
  EmployeeNotification,
} from '../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';
import { formatTimeAgo } from '../utils/time';
import { EmployeeTicketModal } from './EmployeeTicketModal';
import { WorkplacePortalsHub } from './WorkplacePortalsHub';
import { WORKPLACE_PORTALS } from '../data/workplacePortals';
import {
  Search,
  Plus,
  Laptop,
  CheckCircle2,
  Clock,
  ExternalLink,
  User,
  Building,
  Check,
  Copy,
  HelpCircle,
  ThumbsUp,
  Lightbulb,
  Globe,
  LogOut,
  Sparkles,
  X,
  Bell,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface EmployeePortalPageProps {
  tickets: Ticket[];
  kbArticles: KBArticle[];
  assets: ITAsset[];
  users: UserAccount[];
  currentUser?: UserAccount | null;
  onCreateTicket: (newTicket: Ticket) => void;
  onAddComment: (ticketId: string, comment: Omit<TicketComment, 'id' | 'timestamp'>) => void;
  onUpvoteKBArticle?: (id: string) => void;
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
}

export const EmployeePortalPage: React.FC<EmployeePortalPageProps> = ({
  tickets,
  kbArticles,
  assets,
  users,
  currentUser,
  onCreateTicket,
  onAddComment,
  onUpvoteKBArticle,
  onLogout,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<'tickets' | 'devices' | 'portals' | 'kb' | 'notifications'>('tickets');

  // Employee Identity (derived from currentUser or localStorage)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>(() => {
    return currentUser?.name || localStorage.getItem('ewf_employee_name') || 'Sarah Chen';
  });
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('ewf_employee_email') || 'sarah.chen@enterprise.io';
  });
  const [selectedEmployeeDept, setSelectedEmployeeDept] = useState<string>(() => {
    return currentUser?.department || localStorage.getItem('ewf_employee_dept') || 'Engineering';
  });

  // Employee Notifications State
  const [notifications, setNotifications] = useState<EmployeeNotification[]>(() => {
    const userKey = currentUser?.id || currentUser?.email || 'default_user';
    const saved = localStorage.getItem(`ewf_emp_notifications_${userKey}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parse error
      }
    }
    return [
      {
        id: 'notif-welcome',
        title: 'Welcome to Staff Support Portal',
        message: 'You can submit requests, track progress in real-time, and receive updates directly here.',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'info',
      },
    ];
  });

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Persist notifications to localStorage
  useEffect(() => {
    const userKey = currentUser?.id || currentUser?.email || 'default_user';
    localStorage.setItem(`ewf_emp_notifications_${userKey}`, JSON.stringify(notifications));
  }, [notifications, currentUser]);

  // Sync with currentUser
  useEffect(() => {
    if (currentUser) {
      setSelectedEmployeeName(currentUser.name);
      setSelectedEmployeeEmail(currentUser.email);
      setSelectedEmployeeDept(currentUser.department);
      localStorage.setItem('ewf_employee_name', currentUser.name);
      localStorage.setItem('ewf_employee_email', currentUser.email);
      localStorage.setItem('ewf_employee_dept', currentUser.department);
    }
  }, [currentUser]);

  // Automatically detect updates on employee's tickets to create real-time in-portal notifications
  useEffect(() => {
    const myTkts = tickets.filter((t) => {
      return (
        t.reporterName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim() ||
        t.reporterEmail.toLowerCase().trim() === selectedEmployeeEmail.toLowerCase().trim()
      );
    });

    myTkts.forEach((ticket) => {
      // 1. Resolution / Closed Notification
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        const notifId = `notif-status-${ticket.id}-${ticket.status}`;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notifId)) return prev;
          return [
            {
              id: notifId,
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: `Ticket ${ticket.ticketNumber} marked as ${ticket.status}`,
              message: `Your support request "${ticket.title}" has been ${ticket.status.toLowerCase()} by the IT team.`,
              timestamp: ticket.resolvedAt || ticket.updatedAt || new Date().toISOString(),
              isRead: false,
              type: 'status_changed',
            },
            ...prev,
          ];
        });
      }

      // 2. Assignment / In Progress Notification
      if (ticket.status === 'In Progress' && ticket.assignedToName) {
        const notifId = `notif-assigned-${ticket.id}-${ticket.assignedToName}`;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notifId)) return prev;
          return [
            {
              id: notifId,
              ticketId: ticket.id,
              ticketNumber: ticket.ticketNumber,
              title: `Ticket ${ticket.ticketNumber} assigned to ${ticket.assignedToName}`,
              message: `IT specialist ${ticket.assignedToName} is actively working on your request "${ticket.title}".`,
              timestamp: ticket.updatedAt || new Date().toISOString(),
              isRead: false,
              type: 'assigned',
            },
            ...prev,
          ];
        });
      }

      // 3. Comments added by IT Staff / Agent
      if (ticket.comments && ticket.comments.length > 1) {
        const staffComments = ticket.comments.filter(
          (c) =>
            c.authorEmail.toLowerCase() !== selectedEmployeeEmail.toLowerCase() &&
            c.authorName.toLowerCase() !== selectedEmployeeName.toLowerCase()
        );
        staffComments.forEach((comm) => {
          const notifId = `notif-comm-${ticket.id}-${comm.id}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notifId)) return prev;
            return [
              {
                id: notifId,
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: `New reply on ${ticket.ticketNumber} from ${comm.authorName}`,
                message: comm.content.slice(0, 140) + (comm.content.length > 140 ? '...' : ''),
                timestamp: comm.timestamp,
                isRead: false,
                type: 'comment_added',
              },
              ...prev,
            ];
          });
        });
      }
    });
  }, [tickets, selectedEmployeeName, selectedEmployeeEmail]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleOpenNotification = (notif: EmployeeNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setShowNotificationDropdown(false);
    if (notif.ticketId) {
      const match = tickets.find((t) => t.id === notif.ticketId || t.ticketNumber === notif.ticketNumber);
      if (match) {
        setSelectedTicketForModal(match);
      } else {
        setActiveTab('tickets');
      }
    }
  };

  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  // Selected Ticket for Modal View
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);

  // Search States
  const [globalSearch, setGlobalSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('All');
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('All');

  // Request Form State (When user clicks "+ New Support Request")
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formCategory, setFormCategory] = useState<TicketCategory>('Keyboard or mouse not working');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // AI Triage hint for employee
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  // Find devices belonging to the selected employee in the 13-field inventory
  const employeeAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.employeeName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim() ||
        (a.department && a.department.toLowerCase() === selectedEmployeeDept.toLowerCase())
    );
  }, [assets, selectedEmployeeName, selectedEmployeeDept]);

  // Tickets for this employee
  const employeeTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchReporter =
        t.reporterName.toLowerCase().trim() === selectedEmployeeName.toLowerCase().trim() ||
        t.reporterEmail.toLowerCase().trim() === selectedEmployeeEmail.toLowerCase().trim();

      if (!matchReporter) return false;

      if (ticketFilterStatus === 'Active') {
        return t.status !== 'Resolved' && t.status !== 'Closed';
      }
      if (ticketFilterStatus === 'Resolved') {
        return t.status === 'Resolved' || t.status === 'Closed';
      }
      return true;
    });
  }, [tickets, selectedEmployeeName, selectedEmployeeEmail, ticketFilterStatus]);

  // Open Form with Category or Device Reference
  const handleOpenFormWithCategory = (category: TicketCategory, defaultTitle?: string) => {
    setFormCategory(category);
    setFormTitle(defaultTitle || '');
    setFormDescription('');
    setFormPriority('Medium');
    setAiTip(null);
    setShowRequestForm(true);
    setSubmissionSuccess(null);
  };

  // AI Instant Deflection Check on Description
  const handleDescriptionChange = (text: string) => {
    setFormDescription(text);
    if (text.length > 15 && !aiTip) {
      const lower = text.toLowerCase();
      if (lower.includes('vpn') || lower.includes('wifi')) {
        setAiTip('Instant Tip: Try disconnecting & reconnecting to the GlobalProtect VPN client or flushing DNS cache.');
      } else if (lower.includes('password') || lower.includes('login') || lower.includes('okta')) {
        setAiTip('Instant Tip: You can self-service reset your password via the Okta / Azure AD portal.');
      } else if (lower.includes('screen') || lower.includes('freeze') || lower.includes('restart')) {
        setAiTip('Instant Tip: Try holding the laptop power button for 15 seconds to perform a full hardware power cycle.');
      }
    }
  };

  // Submit Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    setIsSubmitting(true);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `INC-${randNum}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      priority: formPriority,
      status: 'Open',
      tier: 'Tier 1 (Helpdesk)',
      assignedAgent: 'Unassigned',
      assignedTeam: 'Workplace Tech',
      reporterName: selectedEmployeeName,
      reporterEmail: selectedEmployeeEmail,
      reporterDepartment: selectedEmployeeDept,
      tags: [formCategory.toLowerCase(), 'employee-portal'],
      createdAt: nowIso,
      updatedAt: nowIso,
      comments: [
        {
          id: `comment-init-${Date.now()}`,
          authorName: selectedEmployeeName,
          authorEmail: selectedEmployeeEmail,
          authorRole: 'User',
          type: 'Public Reply',
          content: formDescription.trim(),
          timestamp: nowIso,
        },
      ],
    };

    onCreateTicket(newTicket);

    // Instant in-portal notification for the employee
    const newEmpNotif: EmployeeNotification = {
      id: `notif-create-${newTicket.id}`,
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      title: `Support Ticket ${newTicket.ticketNumber} Submitted`,
      message: `Your request "${newTicket.title}" was submitted and dispatched to the IT Support team.`,
      timestamp: nowIso,
      isRead: false,
      type: 'created',
    };
    setNotifications((prev) => [newEmpNotif, ...prev]);

    setIsSubmitting(false);
    setShowRequestForm(false);
    setSubmissionSuccess(`Support request ${newTicket.ticketNumber} created successfully! An automated email notification has been dispatched to the IT Support team.`);
    setActiveTab('tickets');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4">
            <div id="navbar-brand-logo" className="flex items-center gap-3">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/ilearn-cc226.firebasestorage.app/o/EWF%20Main.png?alt=media&token=3e05f629-7f10-44ba-a0a9-e901a63010c8"
                alt="EWF Logo"
                className="h-8 max-h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <span className="text-sm sm:text-base font-normal text-slate-900 tracking-tight hidden sm:block">
                Staff Support Portal
              </span>
            </div>
          </div>

          {/* Right Actions: Notifications Bell, Staff Profile, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown for Employee */}
            <div className="relative">
              <button
                id="employee-header-notifications-btn"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl border border-slate-200/90 transition-all cursor-pointer shadow-2xs"
                title="View ticket updates & notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {unreadNotificationCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsAsRead}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-1">
                          <Inbox className="w-6 h-6 mx-auto text-slate-300" />
                          <p className="text-xs font-medium text-slate-600">No notifications</p>
                          <p className="text-[11px] text-slate-400">Updates regarding your tickets will appear here.</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleOpenNotification(notif)}
                            className={`p-3.5 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-start gap-3 ${
                              notif.isRead ? 'bg-white' : 'bg-blue-50/30'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                                notif.type === 'status_changed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : notif.type === 'assigned'
                                  ? 'bg-blue-100 text-blue-700'
                                  : notif.type === 'comment_added'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {notif.type === 'status_changed' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : notif.type === 'assigned' ? (
                                <User className="w-3.5 h-3.5" />
                              ) : notif.type === 'comment_added' ? (
                                <MessageSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-xs truncate ${notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatTimeAgo(notif.timestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                              {notif.ticketNumber && notif.ticketNumber !== 'SYSTEM' && (
                                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                  <span>View Ticket {notif.ticketNumber}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          setActiveTab('notifications');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        View all notifications in portal →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 transition-all cursor-pointer text-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {selectedEmployeeName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-900 block leading-tight truncate max-w-[120px]">
                    {selectedEmployeeName}
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">{selectedEmployeeDept}</span>
                </div>
              </button>

              {/* User Profile Card Dropdown */}
              {showProfileSwitcher && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileSwitcher(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {selectedEmployeeName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{selectedEmployeeName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{selectedEmployeeEmail}</div>
                      </div>
                    </div>

                    <div className="space-y-2 px-1 py-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                        <span className="text-slate-400 text-[11px]">Role</span>
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {currentUser?.role || 'Employee'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                        <span className="text-slate-400 text-[11px]">Department</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{selectedEmployeeDept}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 py-1">
                        <span className="text-slate-400 text-[11px]">Account Status</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </div>
                    </div>

                    {onLogout && (
                      <div className="pt-3 border-t border-slate-100 mt-2">
                        <button
                          onClick={() => {
                            setShowProfileSwitcher(false);
                            onLogout();
                          }}
                          className="w-full py-2 px-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-red-100"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Direct Sign Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of your account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-slate-200 hover:border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Success Alert Banner */}
        {submissionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold">{submissionSuccess}</span>
            </div>
            <button
              onClick={() => setSubmissionSuccess(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4 relative overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {selectedEmployeeName.split(' ')[0]}! How can IT Support help you today?
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Submit a new support ticket, track your existing requests in real-time, view your assigned electronic devices, or quickly access staff workplace portals.
          </p>

          {/* Quick Search */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search guides, solutions, portals, or ticket numbers..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Quick Staff Workplace Portals Launcher Strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Workplace Portals:
            </span>
            {WORKPLACE_PORTALS.map((portal) => (
              <a
                key={portal.id}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${portal.colorScheme.bg} ${portal.colorScheme.border} ${portal.colorScheme.text}`}
              >
                <span>{portal.name}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        </div>

        {/* Main Content Card with Solid White Background for Maximum Readability */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 lg:p-7 space-y-6 relative z-10">
          {/* Main Tab Navigation Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Tickets ({employeeTickets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('devices')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'devices'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>My Devices ({employeeAssets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('portals')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'portals'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Workplace Portals ({WORKPLACE_PORTALS.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('kb')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'kb'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Guides ({kbArticles.length})</span>
              </button>

              <button
                id="emp-tab-notifications"
                onClick={() => {
                  setActiveTab('notifications');
                  handleMarkAllNotificationsAsRead();
                }}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* "+ Submit New Request" Button */}
            <button
              onClick={() => handleOpenFormWithCategory('Keyboard or mouse not working')}
              className="w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Support Request</span>
            </button>
          </div>

        {/* 1. My Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  My Support Tickets ({employeeTickets.length})
                </h2>
                <p className="text-xs text-slate-500">Live real-time status of tickets submitted by {selectedEmployeeName}</p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['All', 'Active', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ticketFilterStatus === st
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {employeeTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketForModal(ticket)}
                    className="p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {ticket.ticketNumber}
                        </span>
                        <CategoryBadge category={ticket.category} showIcon={false} />
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <h4 className="font-normal text-sm text-slate-900 hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 text-xs text-slate-600 shrink-0">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Specialist</span>
                        <strong className="text-slate-800 text-xs">{ticket.assignedAgent}</strong>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Updated</span>
                        <strong className="text-slate-800 text-xs">{formatTimeAgo(ticket.updatedAt)}</strong>
                      </div>

                      <button className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer transition-all">
                        View & Reply ({ticket.comments.length})
                      </button>
                    </div>
                  </div>
                ))}

                {employeeTickets.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-600">No support tickets found for this filter</p>
                    <button
                      onClick={() => handleOpenFormWithCategory('Software')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Submit a New Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. My Issued Devices Tab (13-field electronic device inventory) */}
        {activeTab === 'devices' && !showRequestForm && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  My Assigned Electronic Devices & Accessories ({employeeAssets.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Electronic hardware issued to <strong className="text-slate-800">{selectedEmployeeName}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employeeAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-blue-300 transition-all"
                >
                  {/* Laptop Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{asset.laptopModel}</h3>
                        <span className="font-mono text-xs text-slate-500 block">S/N: {asset.laptopSerialNumber}</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleOpenFormWithCategory(
                          'Laptop not charging or turning on',
                          `Issue reported on ${asset.laptopModel} (${asset.laptopSerialNumber})`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 cursor-pointer transition-all"
                    >
                      Report Issue
                    </button>
                  </div>

                  {/* 13-field Spec Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Laptop Condition</span>
                      <strong className="text-slate-800">{asset.laptopConditionComments || 'Good Condition'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Mouse Issued</span>
                      <strong className={asset.issuedWithMouse === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                        {asset.issuedWithMouse}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Tripod Issued</span>
                      <strong className={asset.issuedWithTripod === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                        {asset.issuedWithTripod}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Lapel Mic</span>
                      <strong className={asset.issuedWithMic === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                        {asset.issuedWithMic}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Phone Model</span>
                      <strong className="text-slate-800">{asset.phoneModel || 'None'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Safaricom Line</span>
                      <strong className="text-slate-800">{asset.safaricomPhoneNumber || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Airtel Line</span>
                      <strong className="text-slate-800">{asset.airtelPhoneNumber || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              ))}

              {employeeAssets.length === 0 && (
                <div className="col-span-full p-10 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
                  <Laptop className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    No hardware assets registered under {selectedEmployeeName}.
                  </p>
                  <p className="text-xs text-slate-400">
                    Switch profiles in the top right to view other employees or contact IT inventory.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Staff Workplace Portals & Services Tab */}
        {activeTab === 'portals' && (
          <WorkplacePortalsHub
            onRequestHelpWithPortal={(portalName, portalUrl) => {
              setFormCategory('Software (App errors, Activation Keys)');
              setFormTitle(`Issue accessing ${portalName} (${portalUrl})`);
              setFormDescription(`I am encountering an issue when attempting to sign into / access ${portalName} at ${portalUrl}.`);
              setFormPriority('Medium');
              setShowRequestForm(true);
            }}
          />
        )}

        {/* 4. Self-Help Knowledge Base Tab */}
        {activeTab === 'kb' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Self-Help Knowledge Base & Guides
                </h2>
                <p className="text-xs text-slate-500">Step-by-step troubleshooting articles for common IT issues</p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', 'Network & VPN', 'Access & IAM', 'Hardware', 'Software'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setKbCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      kbCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kbArticles
                .filter((a) => (kbCategoryFilter === 'All' ? true : a.category === kbCategoryFilter))
                .map((article) => (
                  <div
                    key={article.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CategoryBadge category={article.category} />
                        <span className="text-[11px] text-slate-400">{formatTimeAgo(article.createdAt)}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{article.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{article.summary}</p>

                      {/* Resolution Steps Preview */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Key Steps:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
                          {article.resolutionSteps.slice(0, 3).map((step, idx) => (
                            <li key={idx} className="line-clamp-1">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => onUpvoteKBArticle && onUpvoteKBArticle(article.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({article.helpfulVotes})</span>
                      </button>

                      <span className="text-[11px] text-slate-400">{article.views} views</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 5. Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Your Support Notifications & Updates
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time ticket confirmations, agent assignments, and resolution alerts for {selectedEmployeeName}
                </p>
              </div>

              {unreadNotificationCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you submit a support ticket or an IT specialist updates your issue, you will receive alerts here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleOpenNotification(notif)}
                    className={`p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-4 ${
                      notif.isRead ? 'bg-white' : 'bg-blue-50/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        notif.type === 'status_changed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : notif.type === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : notif.type === 'comment_added'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {notif.type === 'status_changed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : notif.type === 'assigned' ? (
                        <User className="w-4 h-4" />
                      ) : notif.type === 'comment_added' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.ticketNumber && notif.ticketNumber !== 'SYSTEM' && (
                        <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <span>Open Ticket {notif.ticketNumber} Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        </section>
      </main>

      {/* Support Request Popup Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Submit IT Support Request</h2>
                  <p className="text-xs text-slate-500">An incident ticket will be created and dispatched to IT support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1 text-xs">
              {/* Live AI Instant Deflection Hint */}
              {aiTip && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 animate-in fade-in">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="block font-semibold text-amber-900 mb-0.5">Quick Self-Service Suggestion:</strong>
                    <span>{aiTip}</span>
                  </div>
                </div>
              )}

              {/* Category & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="font-semibold text-slate-700 block mb-1">Issue Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white cursor-pointer truncate"
                  >
                    <option value="Keyboard or mouse not working">Keyboard or mouse not working</option>
                    <option value="Laptop not charging or turning on">Laptop not charging or turning on</option>
                    <option value="Email Password">Email Password</option>
                    <option value="Microsoft Office( Word, Powerpoint & Excel)">Microsoft Office( Word, Powerpoint & Excel)</option>
                    <option value="Software (App errors, Activation Keys)">Software (App errors, Activation Keys)</option>
                    <option value="Network Connectivity">Network Connectivity</option>
                    <option value="Equipment Request">Equipment Request</option>
                    <option value="Printer Toner depleted">Printer Toner depleted</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="font-semibold text-slate-700 block mb-1">Urgency / Impact *</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full max-w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white cursor-pointer truncate"
                  >
                    <option value="Low">Low - General inquiry / minor request</option>
                    <option value="Medium">Medium - Standard issue (Work can continue)</option>
                    <option value="High">High - Significant disruption / Blocked from work</option>
                    <option value="Critical">Critical - Complete outage / Work blocked</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Incident Summary / Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mouse cursor freezing intermittently or unable to access Outlook"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Please describe what happened, any error messages, and what you were trying to do..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Submitting info banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                Submitting as <strong className="text-slate-800 font-semibold">{selectedEmployeeName}</strong> ({selectedEmployeeEmail})
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formTitle.trim() || !formDescription.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Ticket Details Modal */}
      {selectedTicketForModal && (
        <EmployeeTicketModal
          ticket={selectedTicketForModal}
          assets={assets}
          onClose={() => setSelectedTicketForModal(null)}
          onAddComment={onAddComment}
        />
      )}
    </div>
  );
};
