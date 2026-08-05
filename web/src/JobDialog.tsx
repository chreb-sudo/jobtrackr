import { useEffect, useState } from 'react';
import { STATUSES, type Job, type JobInput, type Status } from './types';

interface Props {
  job: Job | null;
  initialStatus: Status;
  onClose: () => void;
  onSubmit: (input: JobInput) => Promise<void>;
}

const emptyInput = (status: Status): JobInput => ({
  company: '',
  role: '',
  link: '',
  notes: '',
  status,
  followUpDate: '',
});

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : '');

export function JobDialog({ job, initialStatus, onClose, onSubmit }: Props) {
  const [input, setInput] = useState<JobInput>(emptyInput(initialStatus));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(
      job
        ? {
            company: job.company,
            role: job.role,
            link: job.link ?? '',
            notes: job.notes ?? '',
            status: job.status,
            followUpDate: toDateInput(job.followUpDate),
          }
        : emptyInput(initialStatus),
    );
    setError(null);
  }, [job, initialStatus]);

  const set = <K extends keyof JobInput>(key: K, value: JobInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form className="dialog" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{job ? 'Edit application' : 'New application'}</h2>

        <label>
          Company
          <input
            autoFocus
            required
            value={input.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="Acme Corp"
          />
        </label>

        <label>
          Role
          <input
            required
            value={input.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </label>

        <label>
          Link
          <input
            type="url"
            value={input.link}
            onChange={(e) => set('link', e.target.value)}
            placeholder="https://acme.com/careers/123"
          />
        </label>

        <label>
          Stage
          <select value={input.status} onChange={(e) => set('status', e.target.value as Status)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Follow-up date
          <input
            type="date"
            value={input.followUpDate}
            onChange={(e) => set('followUpDate', e.target.value)}
          />
        </label>

        <label>
          Notes
          <textarea
            rows={4}
            value={input.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Recruiter name, salary range, next steps…"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : job ? 'Save changes' : 'Add application'}
          </button>
        </div>
      </form>
    </div>
  );
}
