import { formatFollowUp, isOverdue } from './reminders';
import type { Job } from './types';

interface Props {
  jobs: Job[];
  days: number;
  onSelect: (job: Job) => void;
}

export function DueSoon({ jobs, days, onSelect }: Props) {
  if (jobs.length === 0) return null;

  return (
    <section className="due-soon" aria-label="Due soon">
      <header className="due-soon-header">
        <h2>Due soon</h2>
        <span className="count">{jobs.length}</span>
        <p className="subtitle">Follow-ups due within {days} days</p>
      </header>
      <ul className="due-soon-list">
        {jobs.map((job) => {
          const overdue = job.followUpDate ? isOverdue(job.followUpDate) : false;
          return (
            <li key={job.id}>
              <button
                type="button"
                className={`due-soon-item${overdue ? ' due-soon-overdue' : ''}`}
                onClick={() => onSelect(job)}
              >
                <span className="due-soon-company">{job.company}</span>
                <span className="due-soon-role">{job.role}</span>
                <span className="due-soon-date">
                  {overdue ? 'Overdue · ' : ''}
                  {job.followUpDate ? formatFollowUp(job.followUpDate) : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
