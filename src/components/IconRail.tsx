import React from 'react';
import {
  Plus,
  Search,
  Compass,
  LayoutGrid,
  Clock,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface IconRailProps {
  activeTab: 'kanban' | 'audit' | 'analytics' | 'members';
  setActiveTab: (tab: 'kanban' | 'audit' | 'analytics' | 'members') => void;
  onOpenCreateTask: () => void;
  onOpenAuthModal: () => void;
  unreadCount?: number;
}

export const IconRail: React.FC<IconRailProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateTask,
  onOpenAuthModal,
}) => {
  return (
    <nav className="icon-rail">
      {/* Top Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        {/* Black Circular Plus Button (Identical to image) */}
        <button
          onClick={onOpenCreateTask}
          className="rail-btn rail-btn-primary"
          title="Create New Task"
          style={{ width: '44px', height: '44px' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        {/* Search */}
        <button
          onClick={() => setActiveTab('kanban')}
          className={`rail-btn ${activeTab === 'kanban' ? 'rail-btn-active' : ''}`}
          title="Search & Filter Tasks"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Kanban Board / Compass */}
        <button
          onClick={() => setActiveTab('kanban')}
          className={`rail-btn ${activeTab === 'kanban' ? 'rail-btn-active' : ''}`}
          title="Kanban Board"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Projects & Workspace Grid */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`rail-btn ${activeTab === 'analytics' ? 'rail-btn-active' : ''}`}
          title="Workspace Analytics & Projects"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* Audit Logs / Clock */}
        <button
          onClick={() => setActiveTab('audit')}
          className={`rail-btn ${activeTab === 'audit' ? 'rail-btn-active' : ''}`}
          title="Audit Trail History"
        >
          <Clock className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Stack: Auth & Role Security */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenAuthModal}
          className="rail-btn"
          title="JWT Authentication & Persona"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Shield className="w-4 h-4 text-indigo-600" />
        </button>

        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '9999px',
            backgroundColor: '#10b981',
          }}
          className="live-indicator"
          title="Real-Time WebSocket Connected"
        />
      </div>
    </nav>
  );
};
