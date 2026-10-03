'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HeartIcon,
  MenuIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { announcement } from '@/data/content';
import { collections } from '@/data/products';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/utils/cn';

export function StoreHeader() {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const { cart, wishlist, user, setMiniCartOpen, setSearchOpen, categories } =
    useStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = cart
    .filter((i) => !i.savedForLater)
    .reduce((s, i) => s + i.qty, 0);
  const active = categories.find((c) => c.key === openMenu);

  return (
    <header
      className="sticky top-0 z-40"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="bg-ink px-4 py-2 text-center text-xs text-canvas/90">
        {announcement}
      </div>
      <div className="border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <button
            className="-ml-2 rounded-md p-2 lg:hidden cursor-pointer"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="font-display text-2xl font-medium tracking-tight text-ink"
          >
            {tenant.name}
          </Link>
          <nav
            aria-label="Main"
            className="hidden h-full items-center gap-7 lg:flex"
          >
            {categories.map((c) => {
              const isActive = pathname.startsWith(`/category/${c.key}`);
              return (
                <Link
                  key={c.key}
                  href={`/category/${c.key}`}
                  onMouseEnter={() => setOpenMenu(c.key)}
                  onFocus={() => setOpenMenu(c.key)}
                  className={cn(
                    'flex h-full items-center border-b-2 text-sm font-medium transition-colors duration-150',
                    isActive || openMenu === c.key
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  )}
                >
                  {c.name}
                </Link>
              );
            })}
            <Link
              href="/collections/eid-2026"
              onMouseEnter={() => setOpenMenu(null)}
              className="whitespace-nowrap text-sm font-medium text-clay hover:text-clay-dark"
            >
              Eid 2026
            </Link>
            <Link
              href="/shop?sale=1"
              onMouseEnter={() => setOpenMenu(null)}
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              Sale
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-56 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-ink-muted hover:border-line-strong md:flex cursor-pointer transition-colors"
            >
              <SearchIcon className="h-4 w-4" aria-hidden />
              <span>Search kurtas, sarees…</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-md p-2 hover:bg-subtle md:hidden cursor-pointer"
              aria-label="Search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            {user?.role === 'OWNER' ? (
              <Link
                href="/admin"
                className="mr-1 hidden whitespace-nowrap rounded-full border border-clay bg-clay/10 px-3 py-1 text-xs font-medium text-clay hover:bg-clay/20 md:inline-block transition-colors"
              >
                Owner dashboard
              </Link>
            ) : null}
            <Link
              href="/wishlist"
              className="relative rounded-md p-2 hover:bg-subtle text-ink cursor-pointer"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <HeartIcon className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay"
                  aria-hidden
                />
              )}
            </Link>
            <Link
              href={user ? (user.role === 'OWNER' ? '/admin' : '/account') : '/login'}
              className="hidden rounded-md p-2 hover:bg-subtle sm:block text-ink cursor-pointer"
              aria-label={user ? (user.role === 'OWNER' ? 'Owner dashboard' : 'My account') : 'Sign in'}
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMiniCartOpen(true)}
              className="relative flex items-center gap-1.5 rounded-md p-2 hover:bg-subtle text-ink cursor-pointer"
              aria-label={`Bag, ${count} items`}
            >
              <ShoppingBagIcon className="h-5 w-5" />
              <span className="text-sm font-medium tabular-nums">{count}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-x-0 hidden border-b border-line bg-canvas shadow-pop lg:block"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 py-8">
              <div className="col-span-3">
                <p className="text-xs font-medium text-ink-muted">
                  Shop {active.name}
                </p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href={`/category/${active.key}`}
                      className="text-sm font-medium text-ink hover:text-clay transition-colors"
                      onClick={() => setOpenMenu(null)}
                    >
                      View all {active.name.toLowerCase()}
                    </Link>
                  </li>
                  {active.subcategories.map((s) => (
                    <li key={s}>
                      <Link
                        href={`/category/${active.key}?sub=${encodeURIComponent(s)}`}
                        className="text-sm text-ink-soft hover:text-ink transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-medium text-ink-muted">Collections</p>
                <ul className="mt-3 space-y-2">
                  {collections.slice(0, 4).map((col) => (
                    <li key={col.slug}>
                      <Link
                        href={`/collections/${col.slug}`}
                        className="text-sm text-ink-soft hover:text-ink transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        {col.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-6 grid grid-cols-2 gap-4">
                <Link
                  href={`/category/${active.key}`}
                  onClick={() => setOpenMenu(null)}
                  className="group relative overflow-hidden rounded-md bg-subtle"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={active.image}
                    alt=""
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-ink/20" aria-hidden />
                  <div className="absolute bottom-0 p-4 text-canvas">
                    <p className="font-display text-lg font-medium">
                      {active.name} New Arrivals
                    </p>
                    <p className="text-xs text-canvas/80">Explore the edit →</p>
                  </div>
                </Link>
                <Link
                  href="/collections/eid-2026"
                  onClick={() => setOpenMenu(null)}
                  className="group relative overflow-hidden rounded-md bg-clay p-6 text-white"
                >
                  <p className="text-xs uppercase tracking-wider text-white/80">
                    Festive Edit
                  </p>
                  <p className="mt-2 font-display text-2xl">Eid 2026</p>
                  <p className="mt-2 text-xs text-white/85">
                    Pre-orders are open. Dispatch begins 28 March.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold">
                    Shop collection <ChevronRightIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu"
      >
        <div className="divide-y divide-line">
          <div className="py-2">
            {categories.map((c) => (
              <div key={c.key} className="py-1">
                <Link
                  href={`/category/${c.key}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-2 text-base font-medium text-ink"
                >
                  <span>{c.name}</span>
                  <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
                </Link>
                {c.subcategories.length > 0 && (
                  <div className="ml-4 space-y-1.5 border-l border-line pl-3 py-1">
                    {c.subcategories.map((s) => (
                      <Link
                        key={s}
                        href={`/category/${c.key}?sub=${encodeURIComponent(s)}`}
                        onClick={() => setMobileOpen(false)}
                        className="block text-sm text-ink-soft hover:text-ink py-1"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/collections/eid-2026"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-2 text-base font-medium text-clay"
            >
              <span>Eid 2026</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/shop?sale=1"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-2 text-base font-medium text-ink"
            >
              <span>Sale</span>
              <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
            </Link>
          </div>
          <div className="py-4 space-y-2">
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-ink hover:text-clay py-1"
            >
              Merchant Admin
            </Link>
            <Link
              href={user ? '/account' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-ink-soft hover:text-ink py-1"
            >
              {user ? `Account (${user.name})` : 'Sign in'}
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-ink-soft hover:text-ink py-1"
            >
              Track an order
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-ink-soft hover:text-ink py-1"
            >
              Our story
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-ink-soft hover:text-ink py-1"
            >
              Contact us
            </Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
