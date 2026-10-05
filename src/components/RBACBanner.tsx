import React from 'react';
import { Role } from '../types';
import { ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';

interface RBACBannerProps {
  currentRole: Role;
  lastRbacError: string | null;
  onClearError: () => void;
}

export const RBACBanner: React.FC<RBACBannerProps> = ({
  currentRole,
  lastRbacError,
  onClearError,
}) => {
  const getPermissions = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return [
          { text: 'Full Org Access', allowed: true },
          { text: 'Manage Projects', allowed: true },
          { text: 'Delete Any Task', allowed: true },
          { text: 'Edit Any Task', allowed: true },
          { text: 'Audit Logs', allowed: true },
        ];
      case 'ADMIN':
        return [
          { text: 'Manage Projects', allowed: true },
          { text: 'Delete Any Task', allowed: true },
          { text: 'Edit Any Task', allowed: true },
          { text: 'Audit Logs', allowed: true },
        ];
      case 'MEMBER':
        return [
          { text: 'Create Tasks', allowed: true },
          { text: 'Edit Assigned Tasks', allowed: true },
          { text: 'Comments & Mentions', allowed: true },
          { text: 'Delete Tasks (Blocked)', allowed: false },
        ];
      case 'VIEWER':
        return [
          { text: 'View Projects & Tasks', allowed: true },
          { text: 'View Comments', allowed: true },
          { text: 'Edit Tasks (403 Blocked)', allowed: false },
          { text: 'Delete Tasks (403 Blocked)', allowed: false },
        ];
      default:
        return [];
    }
  };

  const perms = getPermissions(currentRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
      {/* 403 Forbidden Alert */}
      {lastRbacError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Server 403 Forbidden (RBAC Guard Enforced):
              </span>
              <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>{lastRbacError}</p>
            </div>
          </div>
          <button
            onClick={onClearError}
            className="btn btn-pill-light"
            style={{ padding: '4px 10px', fontSize: '11px', color: '#991b1b', backgroundColor: '#ffffff' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Permissions Diagnostic Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 16px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: 'var(--shadow-sm)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span style={{ color: '#475569' }}>
            Active Role:{' '}
            <strong style={{ color: '#0f172a' }}>
              {currentRole}
            </strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {perms.map((p, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: p.allowed ? '#ecfdf5' : '#fef2f2',
                color: p.allowed ? '#059669' : '#94a3b8',
                border: `1px solid ${p.allowed ? '#a7f3d0' : '#fee2e2'}`,
                textDecoration: p.allowed ? 'none' : 'line-through',
              }}
            >
              {p.allowed ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-red-500" />}
              {p.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
