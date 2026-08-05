export const STATUSES = ['Applied', 'Phone', 'Onsite', 'Offer', 'Rejected'] as const;

export type Status = (typeof STATUSES)[number];
