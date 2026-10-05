import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client.js';

export const ROLE_HIERARCHY = {
  VIEWER: 10,
  MEMBER: 20,
  ADMIN: 30,
  OWNER: 40,
} as const;

export type OrgRole = keyof typeof ROLE_HIERARCHY;

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Core utility function to verify a user's role against an organization
 */
export async function verifyRole(
  userId: string,
  organizationId: string,
  requiredRole: OrgRole
): Promise<{ authorized: boolean; currentRole?: OrgRole; reason?: string }> {
  if (!userId || !organizationId) {
    return { authorized: false, reason: 'Missing userId or organizationId context' };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    return { authorized: false, reason: 'User is not a member of this organization' };
  }

  const userRoleWeight = ROLE_HIERARCHY[membership.role as OrgRole] || 0;
  const requiredWeight = ROLE_HIERARCHY[requiredRole];

  if (userRoleWeight < requiredWeight) {
    return {
      authorized: false,
      currentRole: membership.role as OrgRole,
      reason: `Insufficient permissions: Requires ${requiredRole}, but user is ${membership.role}`,
    };
  }

  return { authorized: true, currentRole: membership.role as OrgRole };
}

/**
 * Express middleware wrapper to enforce organization role check
 */
export function requireOrgRole(requiredRole: OrgRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || req.query.userId as string || req.body?.userId;
      const organizationId =
        (req.headers['x-org-id'] as string) ||
        req.params.orgId ||
        req.params.id || // For /api/organizations/:id
        req.query.organizationId as string ||
        req.body?.organizationId;

      if (!userId || !organizationId) {
        res.status(401).json({
          error: 'Unauthorized: Both x-user-id and organizationId must be provided',
        });
        return;
      }

      const result = await verifyRole(userId, organizationId, requiredRole);
      if (!result.authorized) {
        res.status(403).json({
          error: 'Forbidden',
          message: result.reason,
          currentRole: result.currentRole,
          requiredRole,
        });
        return;
      }

      req.auth = {
        userId,
        organizationId,
        role: result.currentRole!,
      };

      next();
    } catch (err: any) {
      console.error('RBAC Middleware Error:', err);
      res.status(500).json({ error: 'Internal RBAC authorization error' });
    }
  };
}

/**
 * Task-level authorization guard enforcing:
 * - VIEWER: Can only read
 * - MEMBER: Can create tasks, edit ASSIGNED tasks, and comment
 * - ADMIN/OWNER: Can manage any task & delete
 */
export async function verifyTaskAccess(
  userId: string,
  taskId: string,
  action: 'read' | 'edit' | 'delete'
): Promise<{ authorized: boolean; reason?: string; organizationId?: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      organizationId: true,
      assigneeId: true,
      creatorId: true,
    },
  });

  if (!task) {
    return { authorized: false, reason: 'Task not found' };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: task.organizationId,
      },
    },
  });

  if (!membership) {
    return { authorized: false, reason: 'User does not belong to the task\'s organization' };
  }

  const role = membership.role as OrgRole;

  if (action === 'read') {
    return { authorized: true, organizationId: task.organizationId };
  }

  if (action === 'delete') {
    if (ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN) {
      return { authorized: true, organizationId: task.organizationId };
    }
    return { authorized: false, reason: 'Deleting tasks requires ADMIN or OWNER role' };
  }

  if (action === 'edit') {
    // ADMIN or OWNER can edit any task
    if (ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN) {
      return { authorized: true, organizationId: task.organizationId };
    }
    // MEMBER can edit assigned tasks or tasks they created
    if (role === 'MEMBER') {
      if (task.assigneeId === userId || task.creatorId === userId) {
        return { authorized: true, organizationId: task.organizationId };
      }
      return { authorized: false, reason: 'MEMBERs can only edit tasks assigned to them or created by them' };
    }
    return { authorized: false, reason: 'VIEWERs cannot modify tasks' };
  }

  return { authorized: false, reason: 'Unauthorized action' };
}
