import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { requireOrgRole } from '../middleware/rbac.js';

export const projectRouter = Router();

// POST /api/projects - Create a new project (Requires ADMIN or OWNER)
projectRouter.post('/', requireOrgRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, description, organizationId } = req.body;
    const userId = req.auth!.userId;

    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const [project] = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name,
          description,
          organizationId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'PROJECT_CREATED',
          entity: 'Project',
          entityId: proj.id,
          newValue: JSON.stringify({ name: proj.name, description: proj.description }),
        },
      });

      return [proj];
    });

    res.status(201).json(project);
  } catch (err: any) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message || 'Failed to create project' });
  }
});

// GET /api/projects/:id - Get project details with task counts
projectRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const userId = (req.headers['x-user-id'] as string) || req.query.userId as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Verify user belongs to project organization
    if (userId) {
      const isMember = project.organization.members.some((m) => m.userId === userId);
      if (!isMember) {
        res.status(403).json({ error: 'Forbidden: Not a member of this project\'s organization' });
        return;
      }
    }

    res.json(project);
  } catch (err: any) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});
