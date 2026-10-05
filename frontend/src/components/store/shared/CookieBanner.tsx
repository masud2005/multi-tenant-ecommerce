'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customise, setCustomise] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('tanti.cookies');
      if (!consent) {
        setVisible(true);
      }
    }
  }, []);

  const save = (value: string) => {
    try {
      localStorage.setItem('tanti.cookies', value);
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Cookie consent"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-4 left-4 right-4 z-40 max-w-md rounded-lg border border-line bg-surface p-5 shadow-pop sm:right-auto"
        >
          <p className="text-sm font-semibold text-ink">We use cookies</p>
          <p className="mt-1 text-sm text-ink-muted">
            Essential cookies keep your bag and checkout working. With your permission we also use analytics and marketing cookies.{' '}
            <Link href="/policies/cookies" className="underline hover:text-ink">
              Cookie policy
            </Link>
          </p>
          {customise && (
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <div className="flex items-center justify-between text-sm text-ink">
                <span>Essential</span>
                <span className="text-xs text-ink-muted">Always on</span>
              </div>
              <div className="flex items-center justify-between text-sm text-ink">
                <span>Analytics</span>
                <Switch
                  checked={analytics}
                  onChange={setAnalytics}
                  label="Analytics cookies"
                  hideLabel
                />
              </div>
              <div className="flex items-center justify-between text-sm text-ink">
                <span>Marketing</span>
                <Switch
                  checked={marketing}
                  onChange={setMarketing}
                  label="Marketing cookies"
                  hideLabel
                />
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => save('all')}>
              Accept all
            </Button>
            {customise ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => save(`analytics:${analytics},marketing:${marketing}`)}
              >
                Save choices
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCustomise(true)}
              >
                Customise
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => save('essential')}
            >
              Essential only
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
