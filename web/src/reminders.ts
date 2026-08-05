const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export function isOverdue(followUpDate: string): boolean {
  return new Date(followUpDate) < startOfToday();
}

export function formatFollowUp(followUpDate: string): string {
  return new Date(followUpDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
