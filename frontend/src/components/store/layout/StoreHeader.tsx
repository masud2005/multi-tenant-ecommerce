'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HeartIcon,
  MenuIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LogOutIcon,
  ShieldCheckIcon,
  TruckIcon,
  SparklesIcon,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { Drawer } from '@/components/ui/Drawer';
import { cn } from '@/utils/cn';

export function StoreHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const { tenant, isLoading: tenantLoading } = useTenant();
  const {
    cart,
    wishlist,
    user,
    logout,
    setMiniCartOpen,
    setSearchOpen,
    categories,
    collections,
  } = useStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [heroOverlay, setHeroOverlay] = useState(false);
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sync = () => {
      setHeroOverlay(document.documentElement.dataset.heroOverlay === 'true');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-hero-overlay'],
    });
    return () => observer.disconnect();
  }, [pathname]);

  const pageHasOverlayHero = isHome && heroOverlay;
  const overHero = pageHasOverlayHero && !scrolled;

  const count = cart
    .filter((i) => !i.savedForLater)
    .reduce((s, i) => s + i.qty, 0);

  // Direct 1-click destination based on authenticated user's role
  const userRole = (user?.role || '').toUpperCase();
  const isOwnerOrAdmin = ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(userRole);
  const dashboardHref = !user ? '/login' : (isOwnerOrAdmin ? '/admin' : '/account');

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        {/* Top Announcement Bar — only after live tenant settings load (no mock flash) */}
        {!tenantLoading &&
          Boolean(tenant.announcementEnabled && tenant.announcement?.trim()) && (
            <div className="bg-ink text-canvas px-4 py-1.5 text-center text-xs font-medium tracking-wide border-b border-ink-soft/20 shadow-xs">
              {tenant.announcement}
            </div>
          )}

        {/* Main Navbar - Frosted Glassmorphism on scroll */}
        <div
          className={cn(
            'transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out',
            overHero
              ? 'border-b border-transparent bg-transparent shadow-none'
              : 'border-b border-line/60 bg-canvas/75 backdrop-blur-2xl backdrop-saturate-150 shadow-sm'
          )}
        >
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 text-ink hover:text-clay cursor-pointer shrink-0"
                aria-label="Open navigation"
              >
                <MenuIcon className="h-6 w-6" />
              </button>

              {/* Store brand: uploaded logo, else name, else empty — no mock assets */}
              <Link
                href="/"
                className="flex min-h-9 min-w-0 items-center shrink"
                aria-label={tenant.name?.trim() || 'Store home'}
              >
                {!tenantLoading && tenant.logoUrl?.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name?.trim() || 'Store logo'}
                    className="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[160px] object-contain"
                  />
                ) : !tenantLoading && tenant.name?.trim() ? (
                  <span className="font-display text-lg sm:text-2xl font-bold tracking-tight text-ink truncate max-w-[130px] sm:max-w-none">
                    {tenant.name}
                  </span>
                ) : null}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-6">
                <Link
                  href="/shop"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-clay',
                    pathname === '/shop' && !currentCategory ? 'text-clay' : 'text-ink'
                  )}
                >
                  Shop
                </Link>
                {categories.slice(0, 4).map((cat) => (
                  <div
                    key={cat.key}
                    className="relative"
                    onMouseEnter={() => setOpenMenu(cat.key)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <Link
                      href={`/shop?category=${cat.key}`}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-clay py-2 inline-block',
                        pathname === '/shop' && currentCategory === cat.key
                          ? 'text-clay'
                          : 'text-ink'
                      )}
                    >
                      {cat.name}
                    </Link>

                    {/* Category Dropdown Menu */}
                    <AnimatePresence>
                      {openMenu === cat.key && cat.subcategories.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full w-48 rounded-md border border-line bg-surface p-2 shadow-pop"
                        >
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub}
                              href={`/shop?category=${cat.key}&sub=${encodeURIComponent(
                                sub
                              )}`}
                              className="block rounded px-3 py-2 text-xs font-medium text-ink-soft hover:bg-subtle hover:text-ink transition-colors"
                            >
                              {sub}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Collections Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu('collections')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    href="/collections"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-clay py-2 inline-block',
                      pathname.startsWith('/collections') ? 'text-clay' : 'text-ink'
                    )}
                  >
                    Collections
                  </Link>

                  <AnimatePresence>
                    {openMenu === 'collections' && collections.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full w-52 rounded-md border border-line bg-surface p-2 shadow-pop"
                      >
                        {collections.map((col) => (
                          <Link
                            key={col.slug}
                            href={`/collections/${col.slug}`}
                            className="block rounded px-3 py-2 text-xs font-medium text-ink-soft hover:bg-subtle hover:text-ink transition-colors"
                          >
                            {col.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Actions: Search, Wishlist, Account/Dashboard, Cart */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 sm:p-2 text-ink hover:text-clay cursor-pointer transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>

                <Link
                  href="/wishlist"
                  className="relative p-1.5 sm:p-2 text-ink hover:text-clay cursor-pointer transition-colors"
                  aria-label={`Wishlist (${wishlist.length} items)`}
                >
                  <HeartIcon className="h-5 w-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[10px] sm:text-xs font-bold text-white">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {/* Direct 1-Click User / Dashboard Icon */}
                <Link
                  href={dashboardHref}
                  className="p-1.5 sm:p-2 text-ink hover:text-clay cursor-pointer transition-colors relative"
                  aria-label={!user ? 'Sign in' : isOwnerOrAdmin ? 'Admin Dashboard' : 'My Account'}
                  title={!user ? 'Sign in' : isOwnerOrAdmin ? 'Admin Dashboard' : 'My Account'}
                >
                  <UserIcon className="h-5 w-5" />
                  {isOwnerOrAdmin && (
                    <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-clay ring-2 ring-canvas" />
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => setMiniCartOpen(true)}
                  className="relative p-1.5 sm:p-2 text-ink hover:text-clay cursor-pointer transition-colors"
                  aria-label={`Bag (${count} items)`}
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] sm:text-xs font-bold text-canvas">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          side="left"
          width="max-w-[85vw] sm:max-w-sm"
          title={
            <div className="flex items-center gap-2.5">
              {!tenantLoading && tenant.logoUrl?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name?.trim() || 'Store logo'}
                  className="h-7 w-auto max-w-[130px] object-contain"
                />
              ) : (
                <span className="font-display text-base font-bold tracking-tight text-ink">
                  {tenant.name || 'Menu'}
                </span>
              )}
            </div>
          }
          footer={
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>© {new Date().getFullYear()} {tenant.name || 'Store'}</span>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="font-medium text-ink hover:text-clay transition-colors"
              >
                Need Help?
              </Link>
            </div>
          }
        >
            <div className="flex flex-col space-y-6 px-4 py-5 sm:px-5">
              {/* 1. Quick Search Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-subtle/50 px-3.5 py-2.5 text-xs text-ink-muted transition hover:border-ink/20 hover:bg-subtle hover:text-ink cursor-pointer shadow-2xs"
              >
                <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                <span className="flex-1 text-left">Search products, collections...</span>
              </button>

              {/* 2. User Profile / Authentication Section */}
              {user ? (
                    <div className="rounded-2xl border border-line bg-subtle/30 p-3.5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay/15 text-clay font-bold text-sm">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="truncate text-sm font-semibold text-ink">{user.name || 'Customer'}</p>
                            {isOwnerOrAdmin && (
                              <span className="inline-block shrink-0 rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-clay uppercase">
                                {user.role}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-ink-muted">{user.email}</p>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
                          <Link
                            href={dashboardHref}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-ink px-2.5 py-2 text-xs font-semibold text-canvas hover:bg-ink/90 transition-colors"
                          >
                            {isOwnerOrAdmin ? (
                              <ShieldCheckIcon className="h-3.5 w-3.5 text-clay" />
                            ) : (
                              <UserIcon className="h-3.5 w-3.5" />
                            )}
                            <span>{isOwnerOrAdmin ? 'Admin Panel' : 'My Account'}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setMobileOpen(false);
                              logout();
                              window.location.href = '/login';
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          >
                            <LogOutIcon className="h-3.5 w-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                      ) : (
                      <div className="rounded-2xl border border-line bg-subtle/30 p-4 space-y-2.5 text-center">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-ink">Welcome to {tenant.name || 'our store'}</p>
                          <p className="text-xs text-ink-muted">Sign in for orders, faster checkout & wishlist</p>
                        </div>
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas shadow-xs hover:bg-ink/90 transition-colors"
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>Sign In / Register</span>
                        </Link>
                      </div>
                    )}

                      {/* 3. Quick Action Navigation Tiles */}
                      <div className="grid grid-cols-4 gap-2">
                        <Link
                          href="/shop"
                          onClick={() => setMobileOpen(false)}
                          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line/80 bg-surface py-2.5 px-1 text-center hover:border-clay/40 hover:bg-subtle transition-colors group shadow-2xs"
                        >
                          <ShoppingBagIcon className="h-4.5 w-4.5 text-ink-muted group-hover:text-clay transition-colors" />
                          <span className="text-[11px] font-medium text-ink">Shop</span>
                        </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line/80 bg-surface py-2.5 px-1 text-center hover:border-clay/40 hover:bg-subtle transition-colors group shadow-2xs"
                      >
                        <div className="relative">
                          <HeartIcon className="h-4.5 w-4.5 text-ink-muted group-hover:text-clay transition-colors" />
                          {wishlist.length > 0 && (
                            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-ink">Wishlist</span>
                      </Link>

                      <Link
                        href="/track"
                        onClick={() => setMobileOpen(false)}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line/80 bg-surface py-2.5 px-1 text-center hover:border-clay/40 hover:bg-subtle transition-colors group shadow-2xs"
                      >
                        <TruckIcon className="h-4.5 w-4.5 text-ink-muted group-hover:text-clay transition-colors" />
                        <span className="text-[11px] font-medium text-ink">Track</span>
                      </Link>

                      <Link
                        href="/collections"
                        onClick={() => setMobileOpen(false)}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-line/80 bg-surface py-2.5 px-1 text-center hover:border-clay/40 hover:bg-subtle transition-colors group shadow-2xs"
                      >
                        <SparklesIcon className="h-4.5 w-4.5 text-ink-muted group-hover:text-clay transition-colors" />
                        <span className="text-[11px] font-medium text-ink">Explore</span>
                      </Link>
                    </div>

                    {/* 4. Categories with Accordions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                          Categories
                        </p>
                        <Link
                          href="/shop"
                          onClick={() => setMobileOpen(false)}
                          className="text-xs font-semibold text-clay hover:underline"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="divide-y divide-line/60 rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
                        {categories.map((cat) => {
                          const isExpanded = expandedCategory === cat.key;
                          const hasSub = cat.subcategories && cat.subcategories.length > 0;

                          return (
                            <div key={cat.key} className="transition-colors">
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/shop?category=${encodeURIComponent(cat.key)}`}
                                  onClick={() => setMobileOpen(false)}
                                  className={cn(
                                    'flex-1 px-4 py-3 text-sm font-medium transition-colors hover:text-clay',
                                    currentCategory === cat.key ? 'text-clay font-semibold' : 'text-ink'
                                  )}
                                >
                                  {cat.name}
                                </Link>

                                {hasSub ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCategory((prev) => (prev === cat.key ? null : cat.key))
                                    }
                                    className="p-3 text-ink-muted hover:text-ink cursor-pointer transition-transform"
                                    aria-label={`Toggle ${cat.name} subcategories`}
                                  >
                                    <ChevronDownIcon
                                      className={cn(
                                        'h-4 w-4 transition-transform duration-200',
                                        isExpanded ? 'rotate-180 text-clay' : ''
                                      )}
                                    />
                                  </button>
                                ) : (
                                  <Link
                                    href={`/shop?category=${encodeURIComponent(cat.key)}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="p-3 text-ink-muted hover:text-ink"
                                  >
                                    <ChevronRightIcon className="h-4 w-4" />
                                  </Link>
                                )}
                              </div>

                              {/* Subcategories Accordion Panel */}
                              {hasSub && isExpanded && (
                                <div className="border-t border-line/40 bg-subtle/30 px-4 py-2 space-y-1">
                                  <Link
                                    href={`/shop?category=${encodeURIComponent(cat.key)}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="block py-1.5 text-xs font-semibold text-clay hover:underline"
                                  >
                                    All {cat.name} &rarr;
                                  </Link>
                                  {cat.subcategories.map((sub) => (
                                    <Link
                                      key={sub}
                                      href={`/shop?category=${encodeURIComponent(cat.key)}&sub=${encodeURIComponent(sub)}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center gap-2 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors pl-2 border-l border-line"
                                    >
                                      {sub}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Featured Collections */}
                    {collections && collections.length > 0 && (
                      <div className="space-y-2">
                        <p className="px-1 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                          Collections
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {collections.slice(0, 6).map((col) => (
                            <Link
                              key={col.slug}
                              href={`/collections/${col.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:border-clay hover:text-clay transition-all shadow-2xs"
                            >
                              <SparklesIcon className="h-3 w-3 text-clay/80" />
                              <span>{col.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Customer Support & Policies */}
                    <div className="space-y-2">
                      <p className="px-1 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                        Customer Support
                      </p>
                      <div className="rounded-xl border border-line bg-surface p-1 divide-y divide-line/40 shadow-2xs">
                        <Link
                          href="/policies/shipping"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-ink hover:text-clay transition-colors"
                        >
                          <span>Shipping & Delivery Policy</span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                        </Link>
                        <Link
                          href="/policies/returns"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-ink hover:text-clay transition-colors"
                        >
                          <span>Returns & Refunds</span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                        </Link>
                        <Link
                          href="/contact"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-ink hover:text-clay transition-colors"
                        >
                          <span>Contact Customer Care</span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                        </Link>
                        <Link
                          href="/faq"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-ink hover:text-clay transition-colors"
                        >
                          <span>Frequently Asked Questions</span>
                          <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Drawer>
                      </header>
                      {!pageHasOverlayHero && (
                        <div
                          aria-hidden
                          className={
                            !tenantLoading && Boolean(tenant.announcementEnabled && tenant.announcement?.trim())
                              ? 'h-[5.75rem]'
                              : 'h-16'
                          }
                        />
                      )}
                    </>
                    );
}