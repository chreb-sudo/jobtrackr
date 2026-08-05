import express from 'express';
import cors from 'cors';
import type { PrismaClient } from '@prisma/client';
import { jobsRouter } from './jobs.js';
import { STATUSES } from './status.js';

export function createApp(prisma: PrismaClient) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, statuses: STATUSES }));
  app.use('/api/jobs', jobsRouter(prisma));

  return app;
}
