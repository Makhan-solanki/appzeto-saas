import React, { useState } from 'react';
import { Organization, Project, User, Role, AuditLog, Task } from '../types';
import {
  Calendar,
  FileSpreadsheet,
  FolderArchive,
  Share2,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Sparkles,
  Shield,
  X,
  Copy,
  Check,
  Clock,
  Eye,
} from 'lucide-react';

interface ContextSidebarProps {
  currentOrg: Organization | null;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  currentUser: User | null;
  currentUserRole: Role;
  users: User[];
  tasks?: Task[];
  onSwitchUser: (user: User) => void;
  onOpenCreateProject?: () => void;
  onOpenAuthModal: () => void;
  recentAuditLogs: AuditLog[];
  onClose?: () => void;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  currentOrg,
  organizations,
  currentUser,
  currentUserRole,
  tasks = [],
  onOpenAuthModal,
  recentAuditLogs,
  onClose,
}) => {
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [yesterdayExpanded, setYesterdayExpanded] = useState(true);

  // Active Tool Dialog states
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

  return (
    <aside className="context-sidebar" style={{ padding: '1.25rem 1.15rem' }}>
      {/* 1. Header: Clear Purpose (Workspace Tools & Inspector) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #12141e, #312e81)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(18, 20, 30, 0.15)',
            }}
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Workspace Tools
            </h3>
            <p style={{ fontSize: '10px', color: '#64748b' }}>
              Context & Quick Actions
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-pill-light"
            style={{ width: '32px', height: '32px', padding: 0, flexShrink: 0 }}
            title="Close Tools Panel"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* 2. Menu-Driven Integrations (Quick Workspace Tools) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
        {/* Calendar & Planning Button */}
        <button
          onClick={() => setActiveTool('calendar')}
          className="btn btn-pill-light"
          style={{
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '14px',
            fontSize: '12px',
            color: '#1e293b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span style={{ fontWeight: 600 }}>Calendar & Planning</span>
          </div>
          <span style={{ fontSize: '10px', color: '#0284c7', backgroundColor: '#f0f9ff', padding: '2px 6px', borderRadius: '9999px', fontWeight: 700 }}>
            {tasks.filter((t) => t.dueDate).length} Due
          </span>
        </button>

        {/* File Reader Button */}
        <button
          onClick={() => setActiveTool('files')}
          className="btn btn-pill-light"
          style={{
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '14px',
            fontSize: '12px',
            color: '#1e293b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <span style={{ fontWeight: 600 }}>File Reader</span>
          </div>
          <span style={{ fontSize: '10px', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '9999px', fontWeight: 700 }}>
            Docs
          </span>
        </button>

        {/* Media Files Button */}
        <button
          onClick={() => setActiveTool('media')}
          className="btn btn-pill-light"
          style={{
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '14px',
            fontSize: '12px',
            color: '#1e293b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderArchive className="w-3.5 h-3.5" />
            </div>
            <span style={{ fontWeight: 600 }}>Media Files</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>31</span>
        </button>
      </div>

      {/* 3. Dark Contrast Capsule Button (Share & Invite) */}
      <button
        onClick={() => setActiveTool('share')}
        className="btn btn-pill-dark"
        style={{
          width: '100%',
          padding: '10px 16px',
          marginBottom: '1.5rem',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        <Share2 className="w-4 h-4 text-white" />
        <span>Share & Invite</span>
      </button>

      {/* 4. Categorized Timeline & Audit Stream (Today, Yesterday, Previous 7 Days) */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Today Section */}
        <div>
          <button
            onClick={() => setTodayExpanded(!todayExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Today</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${todayExpanded ? '' : '-rotate-90'}`} />
          </button>

          {todayExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate" style={{ fontWeight: 600 }}>Alpha Core Platform updates</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#475569',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Review 100k compound indexes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yesterday Section */}
        <div>
          <button
            onClick={() => setYesterdayExpanded(!yesterdayExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Yesterday</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${yesterdayExpanded ? '' : '-rotate-90'}`} />
          </button>

          {yesterdayExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#475569',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Generate 3D scene & assets</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#475569',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Server RBAC authorization spec</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Previous 7 Days Section */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Previous 7 Days
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '10px',
              }}
            >
              <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Multi-tenant schema migration</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE QUICK TOOL MODALS (Calendar, File Reader, Media, Share)
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
    </aside>
  );
};
export default ContextSidebar;
