'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, ShoppingCart, Tag, User, Box, type LucideIcon } from 'lucide-react';
import { adminNav } from '@/data/adminNav';
import { useAdmin } from '@/contexts/AdminContext';
import { useStore } from '@/contexts/StoreContext';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
}

export function CommandPalette({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { can } = useAdmin();
  const { orders, products, customers } = useStore();

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = adminNav.flatMap((g) =>
      g.items
        .filter((i) => can(i.module, i.action))
        .map((i) => ({
          id: i.to,
          label: i.label,
          hint: 'Go to',
          to: i.to,
          icon: i.icon
        }))
    );

    if (!q) return pages.slice(0, 8);
    const s = q.toLowerCase();

    return [
      ...pages.filter((p) => p.label.toLowerCase().includes(s)),
      ...(can('orders')
        ? orders
            .filter((o) => o.number.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s))
            .slice(0, 4)
            .map((o) => ({
              id: o.id,
              label: `${o.number} · ${o.customerName}`,
              hint: 'Order',
              to: `/admin/orders/${o.id}`,
              icon: ShoppingCart
            }))
        : []),
      ...(can('products')
        ? products
            .filter((p) => p.title.toLowerCase().includes(s))
            .slice(0, 4)
            .map((p) => ({
              id: p.id,
              label: p.title,
              hint: 'Product',
              to: `/admin/products/${p.id}`,
              icon: Tag
            }))
        : []),
      ...(can('customers')
        ? customers
            .filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s))
            .slice(0, 3)
            .map((c) => ({
              id: c.id,
              label: c.name,
              hint: 'Customer',
              to: `/admin/customers?c=${c.id}`,
              icon: User
            }))
        : [])
    ];
  }, [q, can, orders, products, customers]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const go = (it: Item) => {
    router.push(it.to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command menu"
        >
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 text-ink-muted" aria-hidden />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActive((a) => Math.min(items.length - 1, a + 1));
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  }
                  if (e.key === 'Enter' && items[active]) go(items[active]);
                }}
                placeholder="Search orders, products, customers or pages…"
                aria-label="Search"
                className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 text-xs text-ink-muted">ESC</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
              {items.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-ink-muted">No results for “{q}”</li>
              )}
              {items.map((it, i) => {
                const Icon = it.icon || Box;
                return (
                  <li key={it.id + it.hint} role="option" aria-selected={i === active}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(it)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm cursor-pointer transition-colors',
                        i === active ? 'bg-subtle text-ink font-medium' : 'text-ink-soft hover:bg-subtle/50'
                      )}
                    >
                      <Icon className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{it.label}</span>
                      <span className="text-xs text-ink-muted">{it.hint}</span>
                      {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-muted" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
