import React, { useState } from 'react';
import { api, setAuthToken } from '../services/api';
import { User, Organization } from '../types';
import {
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string, org?: Organization) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setNewPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onAuthSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.register({
        name,
        email,
        password,
        organizationName: orgName,
      });
      setAuthToken(res.token);
      onAuthSuccess(res.user, res.token, res.organization);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setMode('reset');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.resetPassword({ resetToken, newPassword });
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        resetFormState();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-float)',
          borderRadius: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock className="w-4 h-4" />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {mode === 'login' && 'Sign In to Appzeto'}
              {mode === 'register' && 'Create Workspace'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Set New Password'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                fontSize: '12px',
              }}
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '12px',
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          {mode === 'login' && (
            <div
              style={{
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid rgba(15, 23, 42, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6366f1', fontWeight: 700, marginBottom: '8px' }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fill Persona (Pass: password123):</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('alex.owner@techcorp.io')}
                  className="badge badge-owner"
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                >
                  Alex (Owner)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('sarah.admin@techcorp.io')}
                  className="badge badge-admin"
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                >
                  Sarah (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('marcus.member@techcorp.io')}
                  className="badge badge-member"
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                >
                  Marcus (Member)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCreds('linda.viewer@techcorp.io')}
                  className="badge badge-viewer"
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                >
                  Linda (Viewer)
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-control"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetFormState();
                    }}
                    style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-control"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-pill-dark" style={{ width: '100%', padding: '11px' }}>
                {loading ? 'Authenticating...' : 'Sign In with JWT'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetFormState();
                  }}
                  style={{ fontSize: '12px', color: '#6366f1', fontWeight: 700 }}
                >
                  Create one
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Smith"
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Workspace / Organization
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Tech"
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@apex.io"
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Password (Bcrypt hashed)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-control"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-pill-dark" style={{ width: '100%', padding: '11px', marginTop: '6px' }}>
                {loading ? 'Creating...' : 'Register Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFormState();
                  }}
                  style={{ fontSize: '12px', color: '#64748b' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: '#475569' }}>
                Enter your account email to request a secure reset token:
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input-control"
              />
              <button type="submit" disabled={loading} className="btn btn-pill-dark" style={{ width: '100%', padding: '11px' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetFormState();
                  }}
                  style={{ fontSize: '12px', color: '#64748b' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="input-control"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  New Password (Bcrypt hashed)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-control"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-pill-dark" style={{ width: '100%', padding: '11px' }}>
                {loading ? 'Updating...' : 'Save New Password & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
