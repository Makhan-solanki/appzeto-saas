import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { requireOrgRole } from '../middleware/rbac.js';

export const auditRouter = Router();

// GET /api/audit-logs - Searchable and filterable audit log query
auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      entity,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const currentUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string);

    if (!organizationId) {
      res.status(400).json({ error: 'organizationId is required' });
      return;
    }

    // Role check: Only ADMIN, OWNER, or organization members can view audit logs
    if (currentUserId) {
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: currentUserId,
            organizationId: organizationId as string,
          },
        },
      });

      if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
        res.status(403).json({ error: 'Forbidden: Only ADMIN and OWNER roles can access organizational audit logs' });
        return;
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where: any = {
      organizationId: organizationId as string,
    };

    if (entity) where.entity = entity as string;
    if (entityId) where.entityId = entityId as string;
    if (action) where.action = action as string;
    if (userId) where.userId = userId as string;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
