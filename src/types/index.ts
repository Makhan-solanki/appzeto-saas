export type Role = 'VIEWER' | 'MEMBER' | 'ADMIN' | 'OWNER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface OrganizationMember {
  id: string;
  role: Role;
  userId: string;
  organizationId: string;
  user?: User;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  userRole?: Role;
  _count?: {
    projects: number;
    members: number;
    tasks: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  organization?: {
    members: {
      userId: string;
      role: Role;
      user: User;
    }[];
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  labels?: string | null;
  projectId: string;
  organizationId: string;
  assigneeId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  creator?: User;
  _count?: {
    comments: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId: string;
  organizationId: string;
  timestamp: string;
  user: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}
