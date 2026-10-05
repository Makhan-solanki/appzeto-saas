import React, { useState } from 'react';
import { Task, TaskStatus, Role } from '../types';
import { TaskCard } from './TaskCard';
import { CircleDot, Clock, Eye, CheckCircle2 } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, targetStatus: TaskStatus) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  currentUserRole: Role;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  badgeClass: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'TODO',
    title: 'To Do',
    icon: <CircleDot className="w-4 h-4 text-slate-500" />,
    badgeClass: 'status-todo',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    icon: <Clock className="w-4 h-4 text-sky-600" />,
    badgeClass: 'status-inprogress',
  },
  {
    id: 'REVIEW',
    title: 'Review',
    icon: <Eye className="w-4 h-4 text-amber-600" />,
    badgeClass: 'status-review',
  },
  {
    id: 'DONE',
    title: 'Done',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    badgeClass: 'status-done',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskMove,
  onSelectTask,
  onDeleteTask,
  currentUserRole,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredColumnId !== colId) {
      setHoveredColumnId(colId);
    }
  };

  const handleDragLeave = () => {
    setHoveredColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setHoveredColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== colId) {
        onTaskMove(taskId, colId);
      }
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="kanban-grid">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isHovered = hoveredColumnId === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`kanban-column ${isHovered ? 'drop-active' : ''}`}
          >
            {/* Column Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                marginBottom: '14px',
                borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {col.icon}
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {col.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {columnTasks.length === 0 ? (
                <div
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    borderRadius: '16px',
                    border: '2px dashed rgba(15, 23, 42, 0.08)',
                    color: '#94a3b8',
                    fontSize: '12px',
                  }}
                >
                  Drop task card here
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={onSelectTask}
                    onDelete={onDeleteTask}
                    onDragStart={handleDragStart}
                    currentUserRole={currentUserRole}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
