import { Task, Organization, Project, AuditLog, Notification, User } from '../types';

let currentUserId = 'usr_owner_1';
let currentOrgId = 'org_comp_a';
let currentToken = localStorage.getItem('token') || '';

export function setAuthToken(token: string) {
  currentToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getAuthToken() {
  return currentToken;
}

export function setAuthContext(userId: string, orgId: string) {
  currentUserId = userId;
  currentOrgId = orgId;
}

export function getAuthContext() {
  return { userId: currentUserId, orgId: currentOrgId };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (currentUserId) headers.set('x-user-id', currentUserId);
  if (currentOrgId) headers.set('x-org-id', currentOrgId);
  if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`);

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Authentication (JWT + bcryptjs)
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { name: string; email: string; password: string; organizationName?: string }) =>
    request<{ token: string; user: User; organization: Organization }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string; resetUrl?: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),

  resetPassword: (data: { resetToken: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users for Role switcher sandbox
  getUsers: () => request<User[]>('/api/users'),

  // Organizations
  getOrganizations: () => request<Organization[]>('/api/organizations'),
  createOrganization: (data: { name: string; slug?: string }) =>
    request<{ organization: Organization }>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ ...data, userId: currentUserId }),
    }),

  // Projects
  getProject: (projectId: string) => request<Project>(`/api/projects/${projectId}`),
  createProject: (data: { name: string; description?: string; organizationId: string }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tasks
  getTasks: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: Task[]; pagination: any }>(`/api/tasks?${query}`);
  },
  getTask: (taskId: string) => request<Task>(`/api/tasks/${taskId}`),
  createTask: (data: Partial<Task>) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...data, userId: currentUserId }),
    }),
  updateTask: (taskId: string, data: Partial<Task>) =>
    request<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, userId: currentUserId }),
    }),
  deleteTask: (taskId: string) =>
    request<{ message: string; id: string }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  addComment: (taskId: string, content: string) =>
    request<any>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, userId: currentUserId }),
    }),

  // Audit Logs
  getAuditLogs: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ data: AuditLog[]; pagination: any }>(`/api/audit-logs?${query}`);
  },

  // Notifications
  getNotifications: () => request<Notification[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ userId: currentUserId }),
    }),
};
