import React, { useState, useEffect } from 'react';
import { Task, User, TaskStatus, Priority, Role } from '../types';
import { api } from '../services/api';
import {
  X,
  MessageSquare,
  Send,
  AlertCircle,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (data: Partial<Task>) => Promise<void>;
  users: User[];
  currentUser: User | null;
  currentUserRole: Role;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSaveTask,
  users,
  currentUserRole,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');
      setPriority(task.priority || 'MEDIUM');
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setLabels(task.labels || '');
      api.getTask(task.id).then((fullTask) => {
        if ((fullTask as any).comments) {
          setComments((fullTask as any).comments);
        }
      }).catch(console.error);
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setAssigneeId('');
      setDueDate('');
      setLabels('');
      setComments([]);
    }
    setError(null);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveTask({
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        labels,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    try {
      const added = await api.addComment(task.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    }
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
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
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
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            {isEditing ? 'Task Details' : 'Create New Task'}
          </h3>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <form id="task-modal-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement server-side RBAC middleware"
                className="input-control"
                disabled={currentUserRole === 'VIEWER'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide task specs, acceptance criteria, or details..."
                className="input-control"
                style={{ borderRadius: '16px' }}
                disabled={currentUserRole === 'VIEWER'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="select-control"
                  style={{ width: '100%' }}
                  disabled={currentUserRole === 'VIEWER'}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="select-control"
                  style={{ width: '100%' }}
                  disabled={currentUserRole === 'VIEWER'}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="select-control"
                  style={{ width: '100%' }}
                  disabled={currentUserRole === 'VIEWER'}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-control"
                  disabled={currentUserRole === 'VIEWER'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Labels
              </label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="Backend, Security, Realtime"
                className="input-control"
                disabled={currentUserRole === 'VIEWER'}
              />
            </div>
          </form>

          {/* Comments Section */}
          {isEditing && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Comments ({comments.length})
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Type @username to notify
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '10px' }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                    No comments posted yet.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid rgba(15, 23, 42, 0.05)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#4338ca' }}>
                          {c.user?.name || 'User'}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: '#334155' }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave comment or mention @Alex, @Marcus..."
                  className="input-control"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="btn btn-pill-dark"
                  style={{ padding: '8px 16px' }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid rgba(15, 23, 42, 0.06)',
            backgroundColor: '#ffffff',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {currentUserRole === 'VIEWER' ? (
              <span style={{ color: '#dc2626' }}>Read-only (VIEWER role)</span>
            ) : (
              'Changes auto-trigger atomic audit logs'
            )}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-pill-light">
              Cancel
            </button>
            {currentUserRole !== 'VIEWER' && (
              <button
                type="submit"
                form="task-modal-form"
                disabled={isSubmitting}
                className="btn btn-pill-dark"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
