export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return dateString;
  }
}

export function scoreToTone(score: number): {
  color: string;
  bg: string;
  border: string;
  label: string;
} {
  if (score >= 80) {
    return {
      color: 'rgb(var(--c-success))',
      bg: 'rgb(var(--c-success) / 0.12)',
      border: 'rgb(var(--c-success) / 0.35)',
      label: 'Strong Signal',
    };
  }
  if (score >= 65) {
    return {
      color: 'rgb(var(--c-secondary))',
      bg: 'rgb(var(--c-secondary) / 0.12)',
      border: 'rgb(var(--c-secondary) / 0.35)',
      label: 'Promising Baseline',
    };
  }
  if (score >= 50) {
    return {
      color: 'rgb(var(--c-warning))',
      bg: 'rgb(var(--c-warning) / 0.12)',
      border: 'rgb(var(--c-warning) / 0.35)',
      label: 'Developing',
    };
  }
  return {
    color: 'rgb(var(--c-danger))',
    bg: 'rgb(var(--c-danger) / 0.12)',
    border: 'rgb(var(--c-danger) / 0.35)',
    label: 'Needs Structured Practice',
  };
}
