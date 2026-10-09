'use client';

import React from 'react';
import { formatDate } from '@/utils/format';

interface OrderTimelineStep {
  at: string;
  label: string;
}

interface OrderNote {
  text: string;
  internal?: boolean;
}

interface OrderActivityCardProps {
  timeline: OrderTimelineStep[];
  notes: OrderNote[];
}

export function OrderActivityCard({ timeline, notes }: OrderActivityCardProps) {
  const visibleNotes = notes.filter((n) => !n.internal);

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">Activity</h2>

      {/* Activity Timeline */}
      <ol className="mt-3 space-y-3 border-l border-line pl-4">
        {timeline.map((step, index) => (
          <li key={index} className="relative text-sm">
            <span
              className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                index === 0 ? 'bg-ink' : 'bg-line-strong'
              }`}
              aria-hidden
            />
            <p className="text-ink">{step.label}</p>
            <p className="text-xs text-ink-muted">{formatDate(step.at)}</p>
          </li>
        ))}
      </ol>

      {/* Customer visible notes */}
      {visibleNotes.map((note, index) => (
        <p key={index} className="mt-3 rounded bg-subtle p-2 text-xs text-ink-soft">
          {note.text}
        </p>
      ))}
    </section>
  );
}
