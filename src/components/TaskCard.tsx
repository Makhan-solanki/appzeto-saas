import React from 'react';
import { Task, Role } from '../types';
import { Clock, MessageSquare, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  currentUserRole: Role;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onDelete,
  onDragStart,
}) => {
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'priority-urgent';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      case 'LOW':
        return 'priority-low';
      default:
        return 'priority-low';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onSelect(task)}
      className="glass-card-interactive"
      style={{
        padding: '14px 16px',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      {/* Top Header: Priority Badge & Delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={`badge ${getPriorityClass(task.priority)}`}>
          {task.priority}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          style={{
            padding: '4px',
            borderRadius: '6px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e11d48')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Title */}
      <h4
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#0f172a',
          lineHeight: '1.4',
        }}
      >
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p
          style={{
            fontSize: '12px',
            color: '#64748b',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {task.labels.split(',').map((label, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid rgba(15, 23, 42, 0.06)',
              }}
            >
              {label.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Assignee Avatar, Comments */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid rgba(15, 23, 42, 0.05)',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {task.dueDate && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: isOverdue ? '#e11d48' : '#64748b',
                fontWeight: isOverdue ? 700 : 500,
              }}
              title={isOverdue ? 'Deadline overdue' : 'Due date'}
            >
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}

          {task._count?.comments !== undefined && task._count.comments > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
              <MessageSquare className="w-3 h-3" />
              {task._count.comments}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title={`Assigned to ${task.assignee.name}`}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '9999px',
                overflow: 'hidden',
                backgroundColor: '#e0e7ff',
                border: '1.5px solid #c7d2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '10px', color: '#4338ca', fontWeight: 700 }}>
                  {task.assignee.name.charAt(0)}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            Unassigned
          </span>
        )}
      </div>
    </div>
  );
};
