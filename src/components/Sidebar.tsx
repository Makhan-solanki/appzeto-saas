import React, { useState } from 'react';
import { Organization, Project, User, Role, Task } from '../types';
import {
  Layers,
  FolderKanban,
  FileText,
  Building2,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  Lock,
  Menu,
  X,
  Calendar,
  FileSpreadsheet,
  FolderArchive,
  Share2,
  Copy,
  Check,
  Eye,
} from 'lucide-react';

interface SidebarProps {
  organizations: Organization[];
  currentOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (proj: Project) => void;
  currentUser: User | null;
  currentUserRole: Role;
  users: User[];
  onSwitchUser: (user: User) => void;
  activeTab: 'kanban' | 'audit' | 'analytics' | 'members';
  setActiveTab: (tab: 'kanban' | 'audit' | 'analytics' | 'members') => void;
  onOpenAuthModal: () => void;
  onOpenCreateProject?: () => void;
  taskStats: {
    total: number;
    done: number;
    inProgress: number;
  };
  tasks?: Task[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  organizations,
  currentOrg,
  onSelectOrg,
  projects,
  currentProject,
  onSelectProject,
  currentUser,
  currentUserRole,
  users,
  onSwitchUser,
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenCreateProject,
  taskStats,
  tasks = [],
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // Workspace Tool modal states
  const [activeTool, setActiveTool] = useState<'calendar' | 'files' | 'media' | 'share' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail('');
      setActiveTool(null);
    }, 1500);
  };

  const getRoleBadge = (role: Role) => {
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

  const progressPercent =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <>
      <aside className="sidebar">
        {/* Mobile Top Header (Small Screens Only) */}
        <div className="sidebar-mobile-toggle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="brand-font" style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
                Appzeto
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  marginLeft: '6px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5',
                  fontWeight: 700,
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                PRO
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn btn-pill-light"
            style={{ padding: '6px 10px' }}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Main Sidebar Content Area (Visible on Desktop, Drawer on Mobile) */}
        <div className={`sidebar-body ${mobileOpen ? 'is-open' : ''}`}>
          {/* 1. Brand Logo Header (Visible on Desktop) */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #12141e 0%, #312e81 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(18, 20, 30, 0.18)',
                  flexShrink: 0,
                }}
              >
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span
                className="live-indicator"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '9999px',
                  backgroundColor: '#10b981',
                  border: '2px solid #ffffff',
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 className="brand-font" style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Appzeto
                </h2>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                    fontWeight: 700,
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  PRO
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                Multi-Tenant SaaS Suite
              </p>
            </div>
          </div>

          {/* 2. Workspace Organization Switcher */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentOrg?.name || 'Select Workspace'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>
                      {currentOrg?.userRole?.toLowerCase()} Workspace
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className="w-4 h-4 text-slate-400"
                  style={{
                    transform: orgDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                    marginLeft: '4px',
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {orgDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '6px',
                    padding: '6px',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: 'var(--shadow-float)',
                    zIndex: 60,
                  }}
                >
                  <p style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                    Organizations
                  </p>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        onSelectOrg(org);
                        setOrgDropdownOpen(false);
                        setMobileOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: currentOrg?.id === org.id ? '#6366f1' : '#334155',
                        backgroundColor: currentOrg?.id === org.id ? '#f1f5f9' : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {org.name}
                      </span>
                      {currentOrg?.id === org.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Navigation Links & Projects */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto' }}>
            {/* Main Navigation Views */}
            <div>
              <p style={{ paddingLeft: '8px', marginBottom: '8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>
                Workspace Views
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button
                  onClick={() => {
                    setActiveTab('kanban');
                    setMobileOpen(false);
                  }}
                  className={activeTab === 'kanban' ? 'btn btn-pill-dark' : 'btn btn-pill-light'}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderKanban className="w-4 h-4" />
                    <span>Kanban Board</span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: activeTab === 'kanban' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.08)',
                      color: activeTab === 'kanban' ? '#ffffff' : '#0f172a',
                    }}
                  >
                    {taskStats.total}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('audit');
                    setMobileOpen(false);
                  }}
                  className={activeTab === 'audit' ? 'btn btn-pill-dark' : 'btn btn-pill-light'}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText className="w-4 h-4" />
                    <span>Audit Trail</span>
                  </div>
                  <span className="badge status-done" style={{ fontSize: '9px' }}>
                    Live
                  </span>
                </button>
              </div>
            </div>

            {/* Project Hierarchy List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '8px', paddingRight: '4px', marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>
                  Projects
                </p>
                {onOpenCreateProject && (
                  <button
                    onClick={onOpenCreateProject}
                    style={{ padding: '3px', borderRadius: '4px', color: '#64748b' }}
                    title="Add Project"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      setMobileOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: currentProject?.id === proj.id ? 700 : 500,
                      color: currentProject?.id === proj.id ? '#0f172a' : '#64748b',
                      backgroundColor: currentProject?.id === proj.id ? '#ffffff' : 'transparent',
                      border: currentProject?.id === proj.id ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid transparent',
                      boxShadow: currentProject?.id === proj.id ? 'var(--shadow-sm)' : 'none',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '9999px',
                          backgroundColor: currentProject?.id === proj.id ? '#6366f1' : '#cbd5e1',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proj.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace Tools (Merged from right sidebar) */}
            <div>
              <button
                onClick={() => setToolsExpanded(!toolsExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  paddingLeft: '8px',
                  paddingRight: '4px',
                  marginBottom: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>
                  Workspace Tools
                </p>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400"
                  style={{
                    transform: toolsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {toolsExpanded && (
                <div className="workspace-tools-section">
                  <button className="workspace-tool-btn" onClick={() => setActiveTool('calendar')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="tool-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span>Calendar & Planning</span>
                    </div>
                    <span className="tool-badge" style={{ color: '#0284c7', backgroundColor: '#f0f9ff' }}>
                      {tasks.filter((t) => t.dueDate).length} Due
                    </span>
                  </button>

                  <button className="workspace-tool-btn" onClick={() => setActiveTool('files')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="tool-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <span>File Reader</span>
                    </div>
                    <span className="tool-badge" style={{ color: '#16a34a', backgroundColor: '#f0fdf4' }}>
                      Docs
                    </span>
                  </button>

                  <button className="workspace-tool-btn" onClick={() => setActiveTool('media')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="tool-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                        <FolderArchive className="w-3.5 h-3.5" />
                      </div>
                      <span>Media Files</span>
                    </div>
                    <span className="tool-badge" style={{ color: '#94a3b8', backgroundColor: '#f1f5f9' }}>
                      31
                    </span>
                  </button>

                  <button
                    className="workspace-tool-btn"
                    onClick={() => setActiveTool('share')}
                    style={{ marginTop: '4px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="tool-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                      <span>Share & Invite</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                </div>
              )}
            </div>

            {/* Sprint Velocity Widget */}
            <div
              style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Task Velocity
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1' }}>
                  {progressPercent}%
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '7px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(15, 23, 42, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #10b981)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span>{taskStats.done} done</span>
                <span>{taskStats.inProgress} active</span>
              </div>
            </div>
          </div>

          {/* 4. Active Persona Simulator & Bottom User Card */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(15, 23, 42, 0.06)', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* User Info Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1' }}>
                        {currentUser?.name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.name || 'Active User'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser?.email || 'user@saas.io'}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getRoleBadge(currentUserRole)}`} style={{ fontSize: '9px' }}>
                  {currentUserRole}
                </span>
              </div>

              {/* Role Simulator Action Strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '6px', borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
                <button
                  onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                  className="btn btn-pill-light"
                  style={{ flex: 1, justifyContent: 'space-between', padding: '6px 12px', fontSize: '11px', color: '#0f172a' }}
                >
                  <span>Switch Role</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={onOpenAuthModal}
                  className="btn btn-pill-light"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="JWT Authentication & Profile"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              {/* Persona Switcher Dropdown */}
              {roleSwitcherOpen && (
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: 'var(--shadow-float)',
                  }}
                >
                  <p style={{ padding: '4px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                    Instant Role Simulation
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setRoleSwitcherOpen(false);
                        setMobileOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: currentUser?.id === u.id ? 700 : 500,
                        color: currentUser?.id === u.id ? '#6366f1' : '#334155',
                        backgroundColor: currentUser?.id === u.id ? '#f1f5f9' : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        {u.email.split('@')[0].split('.')[1]?.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          WORKSPACE TOOL MODALS (Calendar, File Reader, Media, Share)
          ========================================================================= */}

      {/* Calendar & Deadlines Modal */}
      {activeTool === 'calendar' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Upcoming Deadlines</h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Scheduled milestones for {currentOrg?.name}</p>
                </div>
              </div>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-light" style={{ padding: '6px' }}>
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>No scheduled tasks</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{task.title}</h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Next Sprint'}
                      </span>
                    </div>
                    <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-dark" style={{ padding: '8px 18px' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Reader Modal */}
      {activeTool === 'files' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Project Documentation</h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Architecture & RBAC specifications</p>
                </div>
              </div>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-light" style={{ padding: '6px' }}>
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {[
                { title: 'Server RBAC Matrix v2.1.pdf', size: '1.4 MB', date: 'Oct 5, 2026' },
                { title: 'Socket.IO Architecture Guide.md', size: '240 KB', date: 'Oct 4, 2026' },
                { title: 'PostgreSQL Composite Indexes Plan.sql', size: '84 KB', date: 'Oct 2, 2026' },
              ].map((doc, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{doc.title}</p>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{doc.size} • {doc.date}</span>
                    </div>
                  </div>
                  <button className="btn btn-pill-light" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-dark" style={{ padding: '8px 18px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Files Modal */}
      {activeTool === 'media' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Workspace Media Assets (31)</h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Figma mockups, design tokens and avatars</p>
                </div>
              </div>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-light" style={{ padding: '6px' }}>
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
              {[
                { name: 'Aurora Palette Mockup', type: 'PNG' },
                { name: 'Kanban Card Component', type: 'SVG' },
                { name: 'Sprint Velocity Chart', type: 'WEBP' },
                { name: 'RBAC Permission Matrix', type: 'JPG' },
                { name: 'Appzeto Brand Icon', type: 'SVG' },
                { name: 'Audit Log Export', type: 'CSV' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FolderArchive className="w-6 h-6 text-amber-500" />
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {item.name}
                  </p>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-dark" style={{ padding: '8px 18px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share & Invite Modal */}
      {activeTool === 'share' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#12141e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Share & Invite Team</h3>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Invite collaborators to {currentOrg?.name}</p>
                </div>
              </div>
              <button onClick={() => setActiveTool(null)} className="btn btn-pill-light" style={{ padding: '6px' }}>
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Instant Link Copy Strip */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                Shareable Workspace Link
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={window.location.origin}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.1)',
                    fontSize: '12px',
                    color: '#0f172a',
                  }}
                />
                <button onClick={handleCopyLink} className="btn btn-pill-light" style={{ padding: '8px 14px' }}>
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Email Invite Form */}
            <form onSubmit={handleSendInvite}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                Invite by Email
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(15, 23, 42, 0.1)',
                    fontSize: '12px',
                    color: '#0f172a',
                  }}
                />
                <button type="submit" className="btn btn-pill-dark" style={{ padding: '8px 16px' }}>
                  {inviteSent ? 'Sent!' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
