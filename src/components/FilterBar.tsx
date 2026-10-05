import React, { useState, useEffect } from 'react';
import { Search, Calendar, RotateCcw, Plus } from 'lucide-react';
import { User } from '../types';

interface FilterBarProps {
  users: User[];
  onFilterChange: (filters: {
    search: string;
    status: string;
    priority: string;
    assigneeId: string;
    dueDateBefore: string;
  }) => void;
  onOpenCreateModal: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  users,
  onFilterChange,
  onOpenCreateModal,
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDateBefore, setDueDateBefore] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({
        search,
        status,
        priority,
        assigneeId,
        dueDateBefore,
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [search, status, priority, assigneeId, dueDateBefore]);

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setAssigneeId('');
    setDueDateBefore('');
  };

  const hasActiveFilters = search || status || priority || assigneeId || dueDateBefore;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '1.25rem',
      }}
    >
      {/* Pill Search Input */}
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
        <Search
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#64748b',
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 100k tasks, descriptions..."
          className="input-control"
          style={{ paddingLeft: '38px' }}
        />
      </div>

      {/* Pill Filter Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select-control"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="select-control"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="select-control"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            padding: '7px 12px',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="date"
            value={dueDateBefore}
            onChange={(e) => setDueDateBefore(e.target.value)}
            style={{
              background: 'transparent',
              fontSize: '11px',
              color: '#334155',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="btn btn-pill-light"
            style={{ padding: '7px 10px' }}
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Dark Action Pill Button */}
      <button
        onClick={onOpenCreateModal}
        className="btn btn-pill-dark"
        style={{ padding: '8px 18px' }}
      >
        <Plus className="w-4 h-4 text-white" />
        <span>New Task</span>
      </button>
    </div>
  );
};
