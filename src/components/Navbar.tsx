import React, { useState } from 'react';
import { Organization, Project, User, Notification, Role } from '../types';
import { api } from '../services/api';
import {
  Bell,
  FolderKanban,
  FileText,
  Activity,
  X,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  organizations: Organization[];
  currentOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (proj: Project) => void;
  users: User[];
  currentUser: User | null;
  currentUserRole: Role;
  onSwitchUser: (user: User) => void;
  activeTab: 'kanban' | 'audit' | 'analytics' | 'members';
  setActiveTab: (tab: 'kanban' | 'audit' | 'analytics' | 'members') => void;
  notifications: Notification[];
  onRefreshNotifications: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  organizations,
  currentOrg,
  projects,
  currentProject,
  onSelectProject,
  currentUserRole,
  activeTab,
  setActiveTab,
  notifications,
  onRefreshNotifications,
  onOpenAuthModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [authHovered, setAuthHovered] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return 'badge-owner';
      case 'ADMIN':
        return 'badge-admin';
      case 'MEMBER':
        return 'badge-member';
      case 'VIEWER':
        return 'badge-viewer';
      default:
        return 'badge-viewer';
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    onRefreshNotifications();
  };

  const handleMarkOneRead = async (id: string) => {
    await api.markNotificationRead(id);
    onRefreshNotifications();
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '1.25rem',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Left: Project Selector Pill + View Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Project Selector Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            padding: '7px 16px',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
          <select
            value={currentProject?.id || ''}
            onChange={(e) => {
              const found = projects.find((p) => p.id === e.target.value);
              if (found) onSelectProject(found);
            }}
            style={{
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('kanban')}
            className={activeTab === 'kanban' ? 'btn btn-pill-dark' : 'btn btn-pill-light'}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={activeTab === 'audit' ? 'btn btn-pill-dark' : 'btn btn-pill-light'}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Real-time Indicator Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#059669',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <span
            className="live-indicator"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '9999px',
              backgroundColor: '#10b981',
            }}
          />
          <span>Live Sync</span>
        </div>

        {/* Role Badge */}
        <span className={`badge ${getRoleBadgeClass(currentUserRole)}`}>
          {currentUserRole}
        </span>

        {/* Standard Auth Icon with Hover Tooltip */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setAuthHovered(true)}
          onMouseLeave={() => setAuthHovered(false)}
        >
          <button
            onClick={onOpenAuthModal}
            className="btn btn-pill-light"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
            }}
            aria-label="JWT Authentication"
          >
            <Lock className="w-4 h-4 text-slate-700" />
          </button>

          {/* Clean Hover Tooltip */}
          {authHovered && (
            <div
              style={{
                position: 'absolute',
                top: '115%',
                right: '50%',
                transform: 'translateX(50%)',
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                zIndex: 70,
                pointerEvents: 'none',
              }}
            >
              Sign In / JWT Auth
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-pill-light"
            style={{ width: '38px', height: '38px', padding: 0, position: 'relative', borderRadius: '9999px' }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '9999px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '320px',
                maxWidth: '90vw',
                padding: '14px',
                boxShadow: 'var(--shadow-float)',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    Notifications
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '8px' }}>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', padding: '16px 0' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkOneRead(n.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        backgroundColor: n.read ? '#ffffff' : '#f0fdf4',
                        border: `1px solid ${n.read ? 'rgba(15, 23, 42, 0.05)' : '#bbf7d0'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#475569' }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
