import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { requireOrgRole } from '../middleware/rbac.js';
import { sendNotification } from '../socket/index.js';

export const organizationRouter = Router();

// POST /api/organizations - Create a new organization
organizationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, userId } = req.body;
    if (!name || !userId) {
      res.status(400).json({ error: 'Name and userId are required' });
      return;
    }

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

    const [organization, member] = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug: orgSlug,
        },
      });

      const mem = await tx.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId: org.id,
          action: 'ORGANIZATION_CREATED',
          entity: 'Organization',
          entityId: org.id,
          newValue: JSON.stringify({ name: org.name, slug: org.slug }),
        },
      });

      return [org, mem];
    });

    res.status(201).json({ organization, membership: member });
  } catch (err: any) {
    console.error('Error creating organization:', err);
    res.status(500).json({ error: err.message || 'Failed to create organization' });
  }
});

// GET /api/organizations - Get organizations for current user
organizationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required via x-user-id header or ?userId query' });
      return;
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                projects: true,
                members: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(memberships.map((m) => ({
      ...m.organization,
      userRole: m.role,
      joinedAt: m.createdAt,
    })));
  } catch (err: any) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// POST /api/organizations/:id/members - Add member (Requires ADMIN or OWNER)
organizationRouter.post('/:id/members', requireOrgRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.id;
    const { targetUserId, role = 'MEMBER' } = req.body;
    const currentUserId = req.auth!.userId;

    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    const [member, org] = await prisma.$transaction(async (tx) => {
      const orgRecord = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });

      const newMember = await tx.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: targetUserId,
            organizationId,
          },
        },
        update: { role },
        create: {
          userId: targetUserId,
          organizationId,
          role,
        },
        include: {
          user: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          organizationId,
          action: 'MEMBER_ADDED_OR_UPDATED',
          entity: 'OrganizationMember',
          entityId: newMember.id,
          newValue: JSON.stringify({ targetUserId, role }),
        },
      });

      return [newMember, orgRecord];
    });

    // Real-time notification to the added user
    await sendNotification({
      userId: targetUserId,
      title: 'Added to Organization',
      message: `You were added to ${org.name} as ${role}`,
      type: 'ORG_ADDED',
      link: `/orgs/${organizationId}`,
    });

    res.status(201).json(member);
  } catch (err: any) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: err.message || 'Failed to add member' });
  }
});

// DELETE /api/organizations/:id/members/:userId - Remove member (Requires ADMIN or OWNER)
organizationRouter.delete('/:id/members/:userId', requireOrgRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.auth!.userId;

    await prisma.$transaction(async (tx) => {
      const targetMember = await tx.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: targetUserId,
            organizationId,
          },
        },
      });

      if (!targetMember) {
        throw new Error('Member not found in organization');
      }

      // Cannot remove the OWNER unless transferring ownership
      if (targetMember.role === 'OWNER') {
        throw new Error('Cannot remove the OWNER of the organization');
      }

      await tx.organizationMember.delete({
        where: {
          userId_organizationId: {
            userId: targetUserId,
            organizationId,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          organizationId,
          action: 'MEMBER_REMOVED',
          entity: 'OrganizationMember',
          entityId: targetMember.id,
          oldValue: JSON.stringify({ userId: targetUserId, role: targetMember.role }),
        },
      });
    });

    res.json({ message: 'Member successfully removed' });
  } catch (err: any) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: err.message || 'Failed to remove member' });
  }
});
