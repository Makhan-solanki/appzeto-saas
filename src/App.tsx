import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Organization,
  Project,
  Task,
  User,
  Role,
  TaskStatus,
  Notification,
  AuditLog,
} from './types';
import { api, setAuthContext, setAuthToken } from './services/api';
import {
  getSocket,
  joinProjectRoom,
  leaveProjectRoom,
  joinUserRoom,
} from './services/socket';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { RBACBanner } from './components/RBACBanner';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'audit' | 'analytics' | 'members'>('kanban');

  const [currentUserRole, setCurrentUserRole] = useState<Role>('OWNER');
  const [lastRbacError, setLastRbacError] = useState<string | null>(null);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [activeFilters, setActiveFilters] = useState<{
    search: string;
    status: string;
    priority: string;
    assigneeId: string;
    dueDateBefore: string;
  }>({
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    dueDateBefore: '',
  });

  // Calculate live task velocity & statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total, done, inProgress };
  }, [tasks]);

  // 1. Initial Setup: Load Users, Orgs
  useEffect(() => {
    async function initData() {
      try {
        const userList = await api.getUsers();
        setUsers(userList);
        if (userList.length > 0) {
          const defaultUser = userList[0];
          setCurrentUser(defaultUser);

          const orgList = await api.getOrganizations();
          setOrganizations(orgList);
          if (orgList.length > 0) {
            const defaultOrg = orgList[0];
            setCurrentOrg(defaultOrg);
            setAuthContext(defaultUser.id, defaultOrg.id);

            const role = defaultOrg.userRole || 'OWNER';
            setCurrentUserRole(role as Role);

            // Fetch default project
            const projectRes = await api.getProject('proj_1');
            setProjects([projectRes]);
            setCurrentProject(projectRes);

            // Fetch recent audit logs
            api.getAuditLogs({ organizationId: defaultOrg.id }).then((res) => {
              setAuditLogs(res.data);
            }).catch(console.error);
          }
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
      }
    }
    initData();
  }, []);

  // 2. Fetch Tasks when Project or Filters change
  const fetchTasks = useCallback(async () => {
    if (!currentProject || !currentOrg) return;
    try {
      const params: Record<string, string> = {
        projectId: currentProject.id,
        organizationId: currentOrg.id,
      };
      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.priority) params.priority = activeFilters.priority;
      if (activeFilters.assigneeId) params.assigneeId = activeFilters.assigneeId;
      if (activeFilters.dueDateBefore) params.dueDateBefore = activeFilters.dueDateBefore;

      const res = await api.getTasks(params);
      setTasks(res.data);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [currentProject, currentOrg, activeFilters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 3. Fetch Notifications for current user
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 4. Real-time WebSocket subscriptions
  useEffect(() => {
    if (!currentProject || !currentUser) return;

    const socket = getSocket();
    joinProjectRoom(currentProject.id, currentUser.id);
    joinUserRoom(currentUser.id);

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    const handleTaskCreated = (newTask: Task) => {
      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
    };

    const handleTaskDeleted = ({ id }: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('notification:new', handleNewNotification);

    return () => {
      leaveProjectRoom(currentProject.id);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('notification:new', handleNewNotification);
    };
  }, [currentProject, currentUser]);

  // 5. User switching for RBAC Simulation
  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    if (currentOrg) {
      setAuthContext(newUser.id, currentOrg.id);
      const membership = (newUser as any).memberships?.find(
        (m: any) => m.organizationId === currentOrg.id
      );
      const role = membership?.role || 'VIEWER';
      setCurrentUserRole(role as Role);
    }
    setLastRbacError(null);
  };

  // 6. Organization switching
  const handleSelectOrg = async (org: Organization) => {
    setCurrentOrg(org);
    if (currentUser) {
      setAuthContext(currentUser.id, org.id);
      const membership = (currentUser as any).memberships?.find(
        (m: any) => m.organizationId === org.id
      );
      setCurrentUserRole((membership?.role as Role) || 'VIEWER');
    }
  };

  // 7. Kanban Drag & Drop with Optimistic UI & Revert on 403
  const handleTaskMove = async (taskId: string, targetStatus: TaskStatus) => {
    const originalTask = tasks.find((t) => t.id === taskId);
    if (!originalTask || originalTask.status === targetStatus) return;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: targetStatus });
      setLastRbacError(null);
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: originalTask.status } : t))
      );
      setLastRbacError(
        err.data?.message || err.message || 'Action rejected: 403 Forbidden'
      );
    }
  };

  // 8. Delete Task Handler (RBAC Guarded)
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setLastRbacError(null);
    } catch (err: any) {
      setLastRbacError(
        err.data?.message || err.message || 'Action rejected: 403 Forbidden'
      );
    }
  };

  // 9. Create / Update Task via Modal
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      const updated = await api.updateTask(selectedTask.id, taskData);
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    } else {
      if (!currentProject || !currentOrg) return;
      const created = await api.createTask({
        ...taskData,
        projectId: currentProject.id,
        organizationId: currentOrg.id,
      });
      setTasks((prev) => [created, ...prev]);
    }
    setLastRbacError(null);
  };

  // 10. Handle Authentication Success (Login/Register)
  const handleAuthSuccess = async (user: User, token: string, newOrg?: Organization) => {
    setCurrentUser(user);
    const orgList = await api.getOrganizations();
    setOrganizations(orgList);
    const targetOrg = newOrg || orgList[0];
    if (targetOrg) {
      setCurrentOrg(targetOrg);
      setAuthContext(user.id, targetOrg.id);
      setCurrentUserRole((targetOrg.userRole as Role) || 'OWNER');
    }
    const updatedUsers = await api.getUsers();
    setUsers(updatedUsers);
  };

  const handleLogout = () => {
    setAuthToken('');
    if (users.length > 0) {
      handleSwitchUser(users[0]);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Main Standard Sidebar (Shown by default on left) */}
      <Sidebar
        organizations={organizations}
        currentOrg={currentOrg}
        onSelectOrg={handleSelectOrg}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={setCurrentProject}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        users={users}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab as any}
        setActiveTab={(t) => setActiveTab(t as any)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCreateProject={() => setIsProjectModalOpen(true)}
        taskStats={taskStats}
        tasks={tasks}
      />

      {/* 2. Main Center Viewport with Floating Glass Canvas */}
      <div className="main-viewport">
        <div className="floating-canvas">
          {/* Header & Controls */}
          <Navbar
            organizations={organizations}
            currentOrg={currentOrg}
            onSelectOrg={handleSelectOrg}
            projects={projects}
            currentProject={currentProject}
            onSelectProject={setCurrentProject}
            users={users}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            onSwitchUser={handleSwitchUser}
            activeTab={activeTab as any}
            setActiveTab={(t) => setActiveTab(t as any)}
            notifications={notifications}
            onRefreshNotifications={fetchNotifications}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* RBAC Diagnostic Banner & Active Role Indicator */}
          <RBACBanner
            currentRole={currentUserRole}
            lastRbacError={lastRbacError}
            onClearError={() => setLastRbacError(null)}
          />

          {/* Kanban View */}
          {activeTab === 'kanban' && (
            <>
              {/* Filter and Search Bar */}
              <FilterBar
                users={users}
                onFilterChange={setActiveFilters}
                onOpenCreateModal={() => {
                  setSelectedTask(null);
                  setIsModalOpen(true);
                }}
              />

              {/* Real-Time Kanban Board */}
              <KanbanBoard
                tasks={tasks}
                onTaskMove={handleTaskMove}
                onSelectTask={(task) => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                currentUserRole={currentUserRole}
              />
            </>
          )}

          {/* Audit Logs View */}
          {activeTab === 'audit' && currentOrg && (
            <AuditLogViewer
              organizationId={currentOrg.id}
              currentUserRole={currentUserRole}
            />
          )}

          {/* Analytics / Projects View */}
          {activeTab === 'analytics' && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Workspace Projects & Velocity
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Multi-tenant projects overview and completion metrics
                  </p>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="btn btn-pill-dark"
                >
                  Create Project
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="glass-card-interactive" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      {proj.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      {proj.description || 'Enterprise collaboration workspace'}
                    </p>
                    <button
                      onClick={() => {
                        setCurrentProject(proj);
                        setActiveTab('kanban');
                      }}
                      className="btn btn-pill-light"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                    >
                      Open Board
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Task Creation & Detail Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveTask={handleSaveTask}
        users={users}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
      />

      {/* Project Creation Modal */}
      {currentOrg && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          organizationId={currentOrg.id}
          onProjectCreated={(newProj) => {
            setProjects((prev) => [...prev, newProj]);
            setCurrentProject(newProj);
          }}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Auth Modal (Sign In / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
export default App;
