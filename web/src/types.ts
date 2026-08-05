export const STATUSES = ['Applied', 'Phone', 'Onsite', 'Offer', 'Rejected'] as const;

export type Status = (typeof STATUSES)[number];

export interface Job {
  id: string;
  company: string;
  role: string;
  link: string | null;
  notes: string | null;
  status: Status;
  order: number;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobInput {
  company: string;
  role: string;
  link: string;
  notes: string;
  status: Status;
  followUpDate: string;
}

export interface Reminders {
  days: number;
  jobs: Job[];
}
