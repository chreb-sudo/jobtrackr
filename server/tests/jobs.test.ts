import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { createTestPrisma, destroyTestPrisma } from './setup.js';

const prisma: PrismaClient = createTestPrisma();
const app = createApp(prisma);

const sample = { company: 'Acme', role: 'Frontend Engineer', link: 'https://acme.test/jobs/1', notes: 'Referral' };

beforeEach(async () => {
  await prisma.job.deleteMany();
});

afterAll(async () => {
  await destroyTestPrisma(prisma);
});

describe('GET /api/health', () => {
  it('lists the kanban statuses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.statuses).toEqual(['Applied', 'Phone', 'Onsite', 'Offer', 'Rejected']);
  });
});

describe('POST /api/jobs', () => {
  it('creates a job defaulting to Applied', async () => {
    const res = await request(app).post('/api/jobs').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ company: 'Acme', role: 'Frontend Engineer', status: 'Applied', order: 0 });
    expect(res.body.id).toBeTruthy();
  });

  it('appends to the end of its column', async () => {
    await request(app).post('/api/jobs').send(sample);
    const res = await request(app).post('/api/jobs').send({ ...sample, company: 'Globex' });
    expect(res.body.order).toBe(1);
  });

  it('rejects a missing company', async () => {
    const res = await request(app).post('/api/jobs').send({ role: 'Designer' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid link', async () => {
    const res = await request(app).post('/api/jobs').send({ ...sample, link: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown status', async () => {
    const res = await request(app).post('/api/jobs').send({ ...sample, status: 'Ghosted' });
    expect(res.status).toBe(400);
  });

  it('stores a follow-up date', async () => {
    const res = await request(app).post('/api/jobs').send({ ...sample, followUpDate: '2026-02-15' });
    expect(res.status).toBe(201);
    expect(new Date(res.body.followUpDate).toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });

  it('rejects an invalid follow-up date', async () => {
    const res = await request(app).post('/api/jobs').send({ ...sample, followUpDate: 'someday' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/jobs', () => {
  it('returns jobs ordered by column position', async () => {
    await request(app).post('/api/jobs').send({ ...sample, company: 'First' });
    await request(app).post('/api/jobs').send({ ...sample, company: 'Second' });
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.map((j: { company: string }) => j.company)).toEqual(['First', 'Second']);
  });
});

describe('PATCH /api/jobs/:id', () => {
  it('edits fields', async () => {
    const { body: job } = await request(app).post('/api/jobs').send(sample);
    const res = await request(app).patch(`/api/jobs/${job.id}`).send({ role: 'Staff Engineer', notes: '' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Staff Engineer');
  });

  it('moves a job to another column and puts it last', async () => {
    await request(app).post('/api/jobs').send({ ...sample, status: 'Phone' });
    const { body: job } = await request(app).post('/api/jobs').send(sample);
    const res = await request(app).patch(`/api/jobs/${job.id}`).send({ status: 'Phone' });
    expect(res.body).toMatchObject({ status: 'Phone', order: 1 });
  });

  it('clears the link when sent as an empty string', async () => {
    const { body: job } = await request(app).post('/api/jobs').send(sample);
    const res = await request(app).patch(`/api/jobs/${job.id}`).send({ link: '' });
    expect(res.body.link).toBeNull();
  });

  it('sets and clears the follow-up date', async () => {
    const { body: job } = await request(app).post('/api/jobs').send(sample);
    const set = await request(app).patch(`/api/jobs/${job.id}`).send({ followUpDate: '2026-03-01' });
    expect(new Date(set.body.followUpDate).toISOString()).toBe('2026-03-01T00:00:00.000Z');
    const cleared = await request(app).patch(`/api/jobs/${job.id}`).send({ followUpDate: '' });
    expect(cleared.body.followUpDate).toBeNull();
  });

  it('404s for an unknown id', async () => {
    const res = await request(app).patch('/api/jobs/nope').send({ role: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/jobs/:id', () => {
  it('deletes a job', async () => {
    const { body: job } = await request(app).post('/api/jobs').send(sample);
    expect((await request(app).delete(`/api/jobs/${job.id}`)).status).toBe(204);
    expect((await request(app).get('/api/jobs')).body).toEqual([]);
  });

  it('404s for an unknown id', async () => {
    expect((await request(app).delete('/api/jobs/nope')).status).toBe(404);
  });
});
