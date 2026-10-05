import { prisma } from './client.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting comprehensive SaaS seed with bcrypt hashed passwords...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Hash standard demo password
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users representing each Role in the spec
  const owner = await prisma.user.create({
    data: {
      id: 'usr_owner_1',
      email: 'alex.owner@techcorp.io',
      name: 'Alex Rivera (Owner)',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: 'usr_admin_1',
      email: 'sarah.admin@techcorp.io',
      name: 'Sarah Chen (Admin)',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
  });

  const member = await prisma.user.create({
    data: {
      id: 'usr_member_1',
      email: 'marcus.member@techcorp.io',
      name: 'Marcus Bell (Member)',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      id: 'usr_viewer_1',
      email: 'linda.viewer@techcorp.io',
      name: 'Linda Ross (Viewer)',
      password: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  console.log('✅ Users created with bcrypt hashed passwords (password: password123)');

  // 2. Create Organizations (e.g., Company A and Company B from diagram)
  const companyA = await prisma.organization.create({
    data: {
      id: 'org_comp_a',
      name: 'Acme Technologies (Company A)',
      slug: 'acme-technologies',
    },
  });

  const companyB = await prisma.organization.create({
    data: {
      id: 'org_comp_b',
      name: 'Starlight Global (Company B)',
      slug: 'starlight-global',
    },
  });

  // Assign memberships for Company A
  await prisma.organizationMember.createMany({
    data: [
      { userId: owner.id, organizationId: companyA.id, role: 'OWNER' },
      { userId: admin.id, organizationId: companyA.id, role: 'ADMIN' },
      { userId: member.id, organizationId: companyA.id, role: 'MEMBER' },
      { userId: viewer.id, organizationId: companyA.id, role: 'VIEWER' },
    ],
  });

  // Assign memberships for Company B
  await prisma.organizationMember.createMany({
    data: [
      { userId: owner.id, organizationId: companyB.id, role: 'ADMIN' },
      { userId: member.id, organizationId: companyB.id, role: 'VIEWER' },
    ],
  });

  console.log('✅ Multi-tenant organizations and memberships linked');

  // 3. Create Projects (Project 1 & Project 2 in Company A; Project 3 in Company B)
  const project1 = await prisma.project.create({
    data: {
      id: 'proj_1',
      name: 'Alpha Core Platform 2.0',
      description: 'Next-gen distributed cloud workflow platform',
      organizationId: companyA.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      id: 'proj_2',
      name: 'Mobile Gateway & SDK',
      description: 'iOS and Android client integration APIs',
      organizationId: companyA.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      id: 'proj_3',
      name: 'Starlight Portal',
      description: 'Client dashboard and analytics suite',
      organizationId: companyB.id,
    },
  });

  console.log('✅ Projects created across organizations');

  // 4. Create Initial Kanban Tasks for Project 1 across 4 columns
  const initialTasks = [
    {
      title: 'Design distributed RBAC middleware schema',
      description: 'Support hierarchy VIEWER < MEMBER < ADMIN < OWNER with tenant boundary validation',
      status: 'DONE',
      priority: 'URGENT',
      projectId: project1.id,
      organizationId: companyA.id,
      assigneeId: member.id,
      creatorId: owner.id,
      labels: 'Security,Backend',
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      title: 'Kanban drag-and-drop state persistence API',
      description: 'Trigger PUT /api/tasks/:id and automatically create audit log entries in an atomic transaction',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      organizationId: companyA.id,
      assigneeId: member.id,
      creatorId: admin.id,
      labels: 'Feature,Kanban',
      dueDate: new Date(Date.now() + 86400000 * 4),
    },
    {
      title: 'Socket.IO real-time synchronization rooms',
      description: 'Stream task-updated and comment-created events scoped to project rooms',
      status: 'REVIEW',
      priority: 'HIGH',
      projectId: project1.id,
      organizationId: companyA.id,
      assigneeId: admin.id,
      creatorId: owner.id,
      labels: 'Realtime,WebSockets',
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
    {
      title: 'Compound indexes for 100,000 scale dataset',
      description: 'Add composite indexes on [projectId, status, priority] and implement debounced multi-param search',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project1.id,
      organizationId: companyA.id,
      assigneeId: member.id,
      creatorId: member.id,
      labels: 'Database,Performance',
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
    {
      title: 'Notification dispatch for task assignment & mentions',
      description: 'Notify users in real-time when assigned a task or mentioned with @username in comments',
      status: 'TODO',
      priority: 'LOW',
      projectId: project1.id,
      organizationId: companyA.id,
      assigneeId: null,
      creatorId: admin.id,
      labels: 'Notifications',
      dueDate: new Date(Date.now() + 86400000 * 10),
    },
  ];

  for (const t of initialTasks) {
    const task = await prisma.task.create({
      data: t as any,
    });

    // Seed audit log for each task
    await prisma.auditLog.create({
      data: {
        userId: t.creatorId,
        organizationId: t.organizationId,
        action: 'TASK_CREATED',
        entity: 'Task',
        entityId: task.id,
        newValue: JSON.stringify({ title: task.title, status: task.status, priority: task.priority }),
      },
    });
  }

  // Seed sample comments
  const firstTask = await prisma.task.findFirst({ where: { projectId: project1.id } });
  if (firstTask) {
    await prisma.comment.create({
      data: {
        taskId: firstTask.id,
        userId: admin.id,
        content: `Great progress! @${member.name.split(' ')[0]} please check the test coverage.`,
      },
    });
  }

  console.log('✅ Seed complete with bcrypt hashed passwords, tasks, audit logs, and comments!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
