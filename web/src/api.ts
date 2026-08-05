import type { Job, JobInput, Reminders, Status } from './types';

const BASE = '/api/jobs';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const listJobs = () => fetch(BASE).then((r) => handle<Job[]>(r));

export const createJob = (input: JobInput) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => handle<Job>(r));

export const updateJob = (id: string, input: Partial<JobInput> & { status?: Status }) =>
  fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => handle<Job>(r));

export const deleteJob = (id: string) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) => handle<void>(r));

export const listReminders = (days?: number) =>
  fetch(days ? `/api/reminders?days=${days}` : '/api/reminders').then((r) => handle<Reminders>(r));
