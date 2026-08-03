import type { ReactNode } from 'react';
import { STATUS_ALERTA_LABEL, STATUS_ALERTA_TONE, type StatusAlerta } from '@/lib/types';

const DOT_CLASS: Record<string, string> = {
  good: 'bg-success',
  warn: 'bg-warn',
  bad: 'bg-danger',
  default: 'bg-muted',
};

const TEXT_CLASS: Record<string, string> = {
  good: 'text-success',
  warn: 'text-warn',
  bad: 'text-danger',
  default: 'text-muted',
};

export function StatusDot({ status }: { status: StatusAlerta }) {
  const tone = STATUS_ALERTA_TONE[status];
  return (
    <span className="inline-flex items-center gap-2">
      <i className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_CLASS[tone]}`} />
      <span className={`font-medium ${TEXT_CLASS[tone]}`}>{STATUS_ALERTA_LABEL[status]}</span>
    </span>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'good' | 'warn' | 'bad' | 'default' }) {
  const toneClass: Record<string, string> = {
    good: 'bg-success-soft text-success',
    warn: 'bg-warn-soft text-warn',
    bad: 'bg-danger-soft text-danger',
    default: 'bg-muted-soft text-muted',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${toneClass[tone]}`}>{children}</span>;
}
