import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { STATUSES } from './status.js';

const createSchema = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  link: z.string().trim().url().optional().or(z.literal('')),
  notes: z.string().trim().optional(),
  status: z.enum(STATUSES).optional(),
  order: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

const normalize = <T extends { link?: string }>(input: T) =>
  input.link === '' ? { ...input, link: null } : input;

export function jobsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const jobs = await prisma.job.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    res.json(jobs);
  });

  router.post('/', async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid job payload', issues: parsed.error.issues });
    }
    const count = await prisma.job.count({ where: { status: parsed.data.status ?? 'Applied' } });
    const job = await prisma.job.create({
      data: { order: count, ...normalize(parsed.data) },
    });
    res.status(201).json(job);
  });

  router.patch('/:id', async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid job payload', issues: parsed.error.issues });
    }
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const movedColumn = parsed.data.status !== undefined && parsed.data.status !== existing.status;
    const order =
      parsed.data.order ??
      (movedColumn ? await prisma.job.count({ where: { status: parsed.data.status } }) : undefined);

    const job = await prisma.job.update({
      where: { id: existing.id },
      data: { ...normalize(parsed.data), ...(order === undefined ? {} : { order }) },
    });
    res.json(job);
  });

  router.delete('/:id', async (req, res) => {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Job not found' });
    await prisma.job.delete({ where: { id: existing.id } });
    res.status(204).end();
  });

  return router;
}
