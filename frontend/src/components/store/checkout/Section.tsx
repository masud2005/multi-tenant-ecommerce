import React from 'react';

interface SectionProps {
  step: number;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ step, title, aside, children }: SectionProps) {
  return (
    <section aria-labelledby={`s${step}`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id={`s${step}`} className="flex items-baseline gap-3 font-display text-xl">
          <span className="font-sans text-sm text-ink-muted">{step}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
