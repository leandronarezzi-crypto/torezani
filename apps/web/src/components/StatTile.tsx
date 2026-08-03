const TONE_CLASS: Record<string, string> = {
  good: 'text-success',
  warn: 'text-warn',
  bad: 'text-danger',
  default: 'text-foreground',
};

export function StatTile({
  label,
  value,
  loading = false,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  loading?: boolean;
  tone?: 'good' | 'warn' | 'bad' | 'default';
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className={`text-2xl font-bold tabular-nums ${TONE_CLASS[tone]}`}>{loading ? '—' : value}</div>
      <div className="mt-1 text-sm text-foreground-soft">{label}</div>
    </div>
  );
}
