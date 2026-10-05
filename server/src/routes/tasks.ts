import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { requireOrgRole, verifyTaskAccess, OrgRole } from '../middleware/rbac.js';
import { broadcastTaskUpdate, sendNotification } from '../socket/index.js';

export const taskRouter = Router();

// GET /api/tasks - Advanced Search & Filtering API (100,000 scale optimized)
taskRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      organizationId,
      status,
      priority,
      assigneeId,
      labels,
      dueDateBefore,
      dueDateAfter,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    if (!organizationId && !projectId) {
      res.status(400).json({ error: 'Either organizationId or projectId must be provided' });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (projectId) where.projectId = projectId as string;
    if (organizationId) where.organizationId = organizationId as string;
    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (labels) {
      where.labels = { contains: labels as string };
    }

    // Due date filtering (e.g. ?dueDateBefore=2026-09-01)
    if (dueDateBefore || dueDateAfter) {
      where.dueDate = {};
      if (dueDateBefore) where.dueDate.lte = new Date(dueDateBefore as string);
      if (dueDateAfter) where.dueDate.gte = new Date(dueDateAfter as string);
    }

    // Text search query across title & description
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
      ];
    }

    // High performance query with selective projection to prevent N+1
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        take,
        skip,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
      pagination: {
        page: pageNum,
        limit: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to search/filter tasks' });
  }
});

// GET /api/tasks/:id - Get single task with comments and audit history
taskRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (err: any) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create task (Requires at least MEMBER role)
taskRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      dueDate,
      labels,
      projectId,
      organizationId,
      assigneeId,
      userId, // Creator userId
    } = req.body;

    const currentUserId = (req.headers['x-user-id'] as string) || userId;
    if (!currentUserId || !organizationId || !projectId || !title) {
      res.status(400).json({ error: 'Missing required task fields or user context' });
      return;
    }

    // Role verification for task creation: Requires >= MEMBER
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: currentUserId,
          organizationId,
        },
      },
    });

    if (!membership || membership.role === 'VIEWER') {
      res.status(403).json({ error: 'Forbidden: VIEWER role cannot create tasks. Requires MEMBER or above.' });
      return;
    }

    const [createdTask, audit] = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          description,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          labels,
          projectId,
          organizationId,
          assigneeId: assigneeId || null,
          creatorId: currentUserId,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: currentUserId,
          organizationId,
          action: 'TASK_CREATED',
          entity: 'Task',
          entityId: task.id,
          newValue: JSON.stringify({
            title: task.title,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
          }),
        },
      });

      return [task, auditLog];
    });

    // Real-time broadcast to project room
    broadcastTaskUpdate(projectId, 'task:created', createdTask);

    // If assigned to another user, trigger real-time notification
    if (assigneeId && assigneeId !== currentUserId) {
      await sendNotification({
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `You were assigned task: "${title}"`,
        type: 'TASK_ASSIGNED',
        link: `/tasks/${createdTask.id}`,
      });
    }

    res.status(201).json(createdTask);
  } catch (err: any) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: err.message || 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task status / details (Kanban Drag & Drop & Persistence)
taskRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const currentUserId = (req.headers['x-user-id'] as string) || req.body.userId;
    const { title, description, status, priority, dueDate, labels, assigneeId } = req.body;

    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized: User ID required' });
      return;
    }

    // Strict RBAC Verification (MEMBER can only edit assigned or created, ADMIN/OWNER can edit any)
    const access = await verifyTaskAccess(currentUserId, taskId, 'edit');
    if (!access.authorized) {
      res.status(403).json({ error: 'Forbidden', message: access.reason });
      return;
    }

    const [updatedTask, audit] = await prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUniqueOrThrow({ where: { id: taskId } });

      const updateData: any = {};
      const changes: Record<string, { old: any; new: any }> = {};

      if (title !== undefined && title !== existing.title) {
        updateData.title = title;
        changes.title = { old: existing.title, new: title };
      }
      if (description !== undefined && description !== existing.description) {
        updateData.description = description;
        changes.description = { old: existing.description, new: description };
      }
      if (status !== undefined && status !== existing.status) {
        updateData.status = status;
        changes.status = { old: existing.status, new: status };
      }
      if (priority !== undefined && priority !== existing.priority) {
        updateData.priority = priority;
        changes.priority = { old: existing.priority, new: priority };
      }
      if (dueDate !== undefined) {
        const parsedDate = dueDate ? new Date(dueDate) : null;
        updateData.dueDate = parsedDate;
        changes.dueDate = { old: existing.dueDate, new: parsedDate };
      }
      if (labels !== undefined && labels !== existing.labels) {
        updateData.labels = labels;
        changes.labels = { old: existing.labels, new: labels };
      }
      if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
        updateData.assigneeId = assigneeId || null;
        changes.assigneeId = { old: existing.assigneeId, new: assigneeId };
      }

      const task = await tx.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      });

      // Write Audit Log atomically
      const auditLog = await tx.auditLog.create({
        data: {
          userId: currentUserId,
          organizationId: existing.organizationId,
          action: changes.status ? 'TASK_STATUS_UPDATED' : 'TASK_UPDATED',
          entity: 'Task',
          entityId: task.id,
          oldValue: JSON.stringify(Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old]))),
          newValue: JSON.stringify(Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new]))),
        },
      });

      return [task, auditLog];
    });

    // Real-Time Socket.IO Synchronization to Project Room
    broadcastTaskUpdate(updatedTask.projectId, 'task:updated', updatedTask);

    // If status changed and assignee is defined, notify assignee
    if (status && updatedTask.assigneeId && updatedTask.assigneeId !== currentUserId) {
      await sendNotification({
        userId: updatedTask.assigneeId,
        title: 'Task Status Updated',
        message: `Task "${updatedTask.title}" status changed to ${status}`,
        type: 'STATUS_CHANGED',
        link: `/tasks/${updatedTask.id}`,
      });
    }

    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: err.message || 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task (Strictly Requires ADMIN or OWNER)
taskRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const currentUserId = (req.headers['x-user-id'] as string) || req.query.userId as string;

    if (!currentUserId) {
      res.status(401).json({ error: 'Unauthorized: User ID required' });
      return;
    }

    const access = await verifyTaskAccess(currentUserId, taskId, 'delete');
    if (!access.authorized) {
      res.status(403).json({ error: 'Forbidden', message: access.reason });
      return;
    }

    const [deletedTask] = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });

      await tx.task.delete({ where: { id: taskId } });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          organizationId: task.organizationId,
          action: 'TASK_DELETED',
          entity: 'Task',
          entityId: taskId,
          oldValue: JSON.stringify({ title: task.title, status: task.status }),
        },
      });

      return [task];
    });

    // Real-Time Broadcast deletion to connected clients
    broadcastTaskUpdate(deletedTask.projectId, 'task:deleted', { id: taskId, projectId: deletedTask.projectId });

    res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: err.message || 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/comments - Add comment & notify mentioned users
taskRouter.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const { content, userId } = req.body;
    const currentUserId = (req.headers['x-user-id'] as string) || userId;

    if (!content || !currentUserId) {
      res.status(400).json({ error: 'Comment content and userId are required' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        organization: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: currentUserId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Broadcast comment update to project
    broadcastTaskUpdate(task.projectId, 'comment:created', { taskId, comment });

    // Check for @mentions in comment (e.g., @john or @alex)
    const mentionRegex = /@(\w+)/g;
    const mentions = [...content.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());

    for (const member of task.organization.members) {
      const match = mentions.some((name) =>
        member.user.name.toLowerCase().includes(name) ||
        member.user.email.toLowerCase().includes(name)
      );

      if (match && member.userId !== currentUserId) {
        await sendNotification({
          userId: member.userId,
          title: 'You were mentioned in a comment',
          message: `Mentioned on task "${task.title}": "${content.slice(0, 60)}..."`,
          type: 'MENTION',
          link: `/tasks/${taskId}`,
        });
      }
    }

    res.status(201).json(comment);
  } catch (err: any) {
    console.error('Error posting comment:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});
