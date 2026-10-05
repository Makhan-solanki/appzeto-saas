import React, { useState, useEffect } from 'react';
import { AuditLog, Role } from '../types';
import { api } from '../services/api';
import {
  FileText,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface AuditLogViewerProps {
  organizationId: string;
  currentUserRole: Role;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  organizationId,
  currentUserRole,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = { organizationId };
      if (actionFilter) params.action = actionFilter;

      const res = await api.getAuditLogs(params);
      setLogs(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [organizationId, actionFilter]);

  const canView = currentUserRole === 'ADMIN' || currentUserRole === 'OWNER';

  if (!canView) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '520px',
          margin: '40px auto',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '9999px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Audit Trail Access Restricted
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
          Organizational audit logs contain sensitive operational tracking data and require{' '}
          <strong style={{ color: '#0f172a' }}>ADMIN</strong> or{' '}
          <strong style={{ color: '#0f172a' }}>OWNER</strong> role.
        </p>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '9999px',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            fontSize: '11px',
            color: '#475569',
          }}
        >
          Switch to <strong>Alex (Owner)</strong> or <strong>Sarah (Admin)</strong> in the top menu to view audit trail.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Immutable Audit Trail
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b' }}>
              Atomic logging of task mutations, status transitions, and role revisions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="select-control"
          >
            <option value="">All Actions</option>
            <option value="TASK_CREATED">TASK_CREATED</option>
            <option value="TASK_STATUS_UPDATED">TASK_STATUS_UPDATED</option>
            <option value="TASK_UPDATED">TASK_UPDATED</option>
            <option value="TASK_DELETED">TASK_DELETED</option>
            <option value="ORGANIZATION_CREATED">ORGANIZATION_CREATED</option>
            <option value="MEMBER_ADDED_OR_UPDATED">MEMBER_ADDED_OR_UPDATED</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn btn-pill-light"
            style={{ width: '36px', height: '36px', padding: 0 }}
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div
        className="glass-panel"
        style={{ overflow: 'hidden', padding: 0 }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '12px 18px' }}>Timestamp</th>
                <th style={{ padding: '12px 18px' }}>User</th>
                <th style={{ padding: '12px 18px' }}>Action</th>
                <th style={{ padding: '12px 18px' }}>Entity</th>
                <th style={{ padding: '12px 18px' }}>Diff (Old → New)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let oldVal: any = null;
                  let newVal: any = null;
                  try {
                    if (log.oldValue) oldVal = JSON.parse(log.oldValue);
                    if (log.newValue) newVal = JSON.parse(log.newValue);
                  } catch (e) {}

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
                        color: '#334155',
                      }}
                    >
                      <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', color: '#64748b', fontFamily: 'monospace' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f172a' }}>
                        {log.user?.name || 'System'}
                      </td>
                      <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {log.entity} <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>({log.entityId.slice(0, 8)})</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '11px' }}>
                          {oldVal && (
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                              {JSON.stringify(oldVal)}
                            </span>
                          )}
                          {oldVal && newVal && <ArrowRight className="w-3 h-3 text-slate-400" />}
                          {newVal && (
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                              {JSON.stringify(newVal)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
