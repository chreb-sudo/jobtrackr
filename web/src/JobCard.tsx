import type { Job } from './types';

interface Props {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onDragStart: (job: Job) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function JobCard({ job, onEdit, onDelete, onDragStart, onDragEnd, dragging }: Props) {
  return (
    <article
      className={`card${dragging ? ' card-dragging' : ''}`}
      draggable
      data-testid={`job-${job.id}`}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', job.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(job);
      }}
      onDragEnd={onDragEnd}
    >
      <header>
        <h3>{job.company}</h3>
        <div className="card-actions">
          <button type="button" title="Edit" aria-label={`Edit ${job.company}`} onClick={() => onEdit(job)}>
            ✎
          </button>
          <button type="button" title="Delete" aria-label={`Delete ${job.company}`} onClick={() => onDelete(job)}>
            ✕
          </button>
        </div>
      </header>
      <p className="role">{job.role}</p>
      {job.notes && <p className="notes">{job.notes}</p>}
      {job.link && (
        <a href={job.link} target="_blank" rel="noreferrer" className="link">
          View posting ↗
        </a>
      )}
    </article>
  );
}
