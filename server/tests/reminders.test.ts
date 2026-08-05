import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { createTestPrisma, destroyTestPrisma } from './setup.js';

const prisma: PrismaClient = createTestPrisma();
const app = createApp(prisma);

const base = { company: 'Acme', role: 'Frontend Engineer' };

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const create = (overrides: Record<string, unknown>) =>
  request(app).post('/api/jobs').send({ ...base, ...overrides });

beforeEach(async () => {
  await prisma.job.deleteMany();
});

afterAll(async () => {
  await destroyTestPrisma(prisma);
});

describe('GET /api/reminders', () => {
  it('returns overdue and soon-due follow-ups, ordered by date', async () => {
    await create({ company: 'Overdue', followUpDate: daysFromNow(-2) });
    await create({ company: 'Soon', followUpDate: daysFromNow(3) });
    await create({ company: 'Later', followUpDate: daysFromNow(30) });
    await create({ company: 'NoDate' });

    const res = await request(app).get('/api/reminders');
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(7);
    expect(res.body.jobs.map((job: { company: string }) => job.company)).toEqual(['Overdue', 'Soon']);
  });

  it('honours the days window', async () => {
    await create({ company: 'Soon', followUpDate: daysFromNow(3) });
    await create({ company: 'Later', followUpDate: daysFromNow(30) });

    const res = await request(app).get('/api/reminders?days=60');
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(60);
    expect(res.body.jobs.map((job: { company: string }) => job.company)).toEqual(['Soon', 'Later']);
  });

  it('excludes jobs without a follow-up date', async () => {
    await create({ company: 'NoDate' });
    const res = await request(app).get('/api/reminders');
    expect(res.body.jobs).toEqual([]);
  });

  it('rejects an invalid days value', async () => {
    const res = await request(app).get('/api/reminders?days=-1');
    expect(res.status).toBe(400);
  });
});
