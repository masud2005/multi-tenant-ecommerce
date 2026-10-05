'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchIcon, XIcon, ClockIcon, TrendingUpIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { popularSearches } from '@/data/content';
import { searchProducts } from '@/utils/search';
import { productPrice } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';

export function SearchOverlay() {
  const router = useRouter();
  const { searchOpen, setSearchOpen, products, recentlyViewed, categories } =
    useStore();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const live = products.filter((p) => p.status === 'published');

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) =>
        e.key === 'Escape' && setSearchOpen(false);
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    setQ('');
  }, [searchOpen, setSearchOpen]);

  const { results, suggestion } = useMemo(
    () => searchProducts(live, q),
    [live, q]
  );
  const matchingCats =
    q.length > 1
      ? categories.filter(
          (c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.subcategories.some((s) =>
              s.toLowerCase().includes(q.toLowerCase())
            )
        )
      : [];
  const recent = recentlyViewed
    .map((id) => live.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4);

  const go = (term: string) => {
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const close = () => setSearchOpen(false);

  return (
    <AnimatePresence>
      {searchOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="relative max-h-[85vh] overflow-y-auto bg-canvas shadow-pop"
          >
            <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim()) go(q.trim());
                }}
                className="flex items-center gap-3 border-b-2 border-ink pb-3"
              >
                <SearchIcon className="h-5 w-5 text-ink-muted" aria-hidden />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for panjabi, jamdani, sneakers…"
                  aria-label="Search products"
                  role="combobox"
                  aria-expanded={q.length > 0}
                  aria-controls="search-results"
                  className="flex-1 bg-transparent text-lg text-ink placeholder:text-ink-muted/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1.5 hover:bg-subtle cursor-pointer"
                  aria-label="Close search"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </form>

              <div id="search-results" className="py-6">
                {!q && (
                  <div className="grid gap-8 md:grid-cols-[200px_1fr]">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <TrendingUpIcon className="h-3.5 w-3.5" aria-hidden />{' '}
                        Popular
                      </p>
                      <ul className="mt-3 space-y-2">
                        {popularSearches.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => go(s)}
                              className="text-sm text-ink hover:text-clay cursor-pointer"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {recent.length > 0 && (
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                          <ClockIcon className="h-3.5 w-3.5" aria-hidden />{' '}
                          Recently viewed
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {recent.map(
                            (p) =>
                              p && (
                                <Link
                                  key={p.id}
                                  href={`/products/${p.slug}`}
                                  onClick={close}
                                  className="group"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={p.images[0]}
                                    alt=""
                                    className="aspect-[3/4] w-full rounded object-cover border border-line bg-subtle"
                                  />
                                  <p className="mt-2 text-sm leading-snug group-hover:underline text-ink line-clamp-1">
                                    {p.title}
                                  </p>
                                </Link>
                              )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {q && (
                  <div>
                    {suggestion && (
                      <p className="mb-4 text-xs text-ink-muted">
                        Did you mean{' '}
                        <button
                          type="button"
                          onClick={() => setQ(suggestion)}
                          className="font-medium text-clay underline cursor-pointer"
                        >
                          {suggestion}
                        </button>
                        ?
                      </p>
                    )}

                    {matchingCats.length > 0 && (
                      <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink-muted">
                          Categories:
                        </span>
                        {matchingCats.map((c) => (
                          <Link
                            key={c.key}
                            href={`/category/${c.key}`}
                            onClick={close}
                            className="rounded-full bg-subtle px-3 py-1 text-xs font-medium text-ink hover:bg-ink hover:text-canvas transition-colors"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {results.slice(0, 8).map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={close}
                            className="group block"
                          >
                            <div className="aspect-[3/4] overflow-hidden rounded bg-subtle border border-line">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.images[0]}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            </div>
                            <p className="mt-2 text-xs text-ink-muted">
                              {p.brand}
                            </p>
                            <p className="text-sm font-medium text-ink group-hover:underline line-clamp-1">
                              {p.title}
                            </p>
                            <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
                              {formatBDT(productPrice(p))}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-ink-muted">
                        <p className="text-sm">No products found for “{q}”</p>
                        <p className="mt-1 text-xs">
                          Try checking your spelling or search by department.
                        </p>
                      </div>
                    )}

                    {results.length > 8 && (
                      <div className="mt-6 text-center">
                        <button
                          type="button"
                          onClick={() => go(q)}
                          className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-subtle cursor-pointer"
                        >
                          View all {results.length} results
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
