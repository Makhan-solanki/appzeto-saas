import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

export const notificationRouter = Router();

// GET /api/notifications - Get current user notifications
notificationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
notificationRouter.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch (err: any) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
notificationRouter.put('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error reading all notifications:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});
