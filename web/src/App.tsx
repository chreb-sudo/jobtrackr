import { useCallback, useEffect, useMemo, useState } from 'react';
import { createJob, deleteJob, listJobs, listReminders, updateJob } from './api';
import { DueSoon } from './DueSoon';
import { JobCard } from './JobCard';
import { JobDialog } from './JobDialog';
import { STATUSES, type Job, type JobInput, type Reminders, type Status } from './types';

type DialogState = { open: false } | { open: true; job: Job | null; status: Status };

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reminders, setReminders] = useState<Reminders>({ days: 7, jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const syncReminders = useCallback(async () => {
    setReminders(await listReminders());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [nextJobs] = await Promise.all([listJobs(), syncReminders()]);
      setJobs(nextJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [syncReminders]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byStatus = useMemo(() => {
    const groups = new Map<Status, Job[]>(STATUSES.map((status) => [status, []]));
    for (const job of jobs) groups.get(job.status)?.push(job);
    for (const column of groups.values()) column.sort((a, b) => a.order - b.order);
    return groups;
  }, [jobs]);

  const submit = async (input: JobInput) => {
    if (!dialog.open) return;
    const saved = dialog.job
      ? await updateJob(dialog.job.id, input)
      : await createJob(input);
    setJobs((prev) =>
      dialog.job ? prev.map((job) => (job.id === saved.id ? saved : job)) : [...prev, saved],
    );
    setDialog({ open: false });
    void syncReminders();
  };

  const remove = async (job: Job) => {
    if (!window.confirm(`Delete ${job.company} — ${job.role}?`)) return;
    setJobs((prev) => prev.filter((item) => item.id !== job.id));
    try {
      await deleteJob(job.id);
      void syncReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
      void refresh();
    }
  };

  const move = async (id: string, status: Status) => {
    const job = jobs.find((item) => item.id === id);
    if (!job || job.status === status) return;
    setJobs((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      const saved = await updateJob(id, { status });
      setJobs((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move job');
      void refresh();
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>JobTrackr</h1>
          <p className="subtitle">
            {jobs.length} application{jobs.length === 1 ? '' : 's'} in flight
          </p>
        </div>
        <button className="primary" onClick={() => setDialog({ open: true, job: null, status: 'Applied' })}>
          + Add application
        </button>
      </header>

      {error && <p className="banner error">{error}</p>}
      {!loading && (
        <DueSoon
          jobs={reminders.jobs}
          days={reminders.days}
          onSelect={(job) => setDialog({ open: true, job, status: job.status })}
        />
      )}
      {loading ? (
        <p className="banner">Loading board…</p>
      ) : (
        <div className="board">
          {STATUSES.map((status) => {
            const columnJobs = byStatus.get(status) ?? [];
            return (
              <section
                key={status}
                className={`column${dragOver === status ? ' column-over' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(status);
                }}
                onDragLeave={() => setDragOver((prev) => (prev === status ? null : prev))}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(null);
                  const id = event.dataTransfer.getData('text/plain') || draggingId;
                  if (id) void move(id, status);
                }}
              >
                <header className="column-header">
                  <h2>{status}</h2>
                  <span className="count">{columnJobs.length}</span>
                </header>
                <div className="column-body">
                  {columnJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      dragging={draggingId === job.id}
                      onDragStart={(dragged) => setDraggingId(dragged.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onEdit={(target) => setDialog({ open: true, job: target, status: target.status })}
                      onDelete={remove}
                    />
                  ))}
                  <button className="add-inline" onClick={() => setDialog({ open: true, job: null, status })}>
                    + Add
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {dialog.open && (
        <JobDialog
          job={dialog.job}
          initialStatus={dialog.status}
          onClose={() => setDialog({ open: false })}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
