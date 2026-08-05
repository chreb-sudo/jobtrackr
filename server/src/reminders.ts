import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

const DEFAULT_WINDOW_DAYS = 7;

const querySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional(),
});

export function remindersRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid reminders query', issues: parsed.error.issues });
    }

    const days = parsed.data.days ?? DEFAULT_WINDOW_DAYS;
    const until = new Date();
    until.setDate(until.getDate() + days);

    const jobs = await prisma.job.findMany({
      where: { followUpDate: { not: null, lte: until } },
      orderBy: [{ followUpDate: 'asc' }],
    });

    res.json({ days, jobs });
  });

  return router;
}
