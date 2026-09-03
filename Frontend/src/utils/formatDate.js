/**
 * Date and overdue calculation utilities for Student UI
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const getDaysOverdue = (dueDateString, returnDateString = null) => {
  if (!dueDateString) return 0;
  const dueDate = new Date(dueDateString);
  const compareDate = returnDateString ? new Date(returnDateString) : new Date();

  if (compareDate > dueDate) {
    const diffTime = compareDate.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};
