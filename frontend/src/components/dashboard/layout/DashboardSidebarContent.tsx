'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/lib/icon-mapper';
import type { NavItem } from '@/config/menu-items';
import type { UserInfo } from '@/types/user';

import { useTenant } from '@/contexts/TenantContext';
import { useAdmin } from '@/contexts/AdminContext';

interface DashboardSidebarContentProps {
  navItems: NavItem[];
  user?: UserInfo;
  onItemClick?: () => void;
}

export function DashboardSidebarContent({
  navItems,
  user: propUser,
  onItemClick,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const { can, user: contextUser } = useAdmin();

  const activeUser = contextUser || propUser;
  const isStaffMember = Boolean(
    activeUser &&
    (activeUser.staffRole || (activeUser.permissions && Object.keys(activeUser.permissions).length > 0)) &&
    !activeUser.isOwner
  );
  const isOwner = !isStaffMember && Boolean(
    activeUser?.isOwner ||
    (activeUser?.role === 'OWNER' && !activeUser?.staffRole) ||
    (activeUser?.role === 'ADMIN' && !activeUser?.staffRole)
  );

  // Group items by category preserving config order, strictly filtering out unpermitted modules
  const categories = React.useMemo(() => {
    const permissions = (activeUser?.permissions as Record<string, string[]>) || {};

    const filtered = navItems.filter((item) => {
      // Store owner sees all menu items
      if (isOwner) return true;

      // Staff member with explicit permission rules: only show permitted modules
      if (isStaffMember) {
        if (!item.module) return false;
        const modPerms = permissions[item.module];
        return Array.isArray(modPerms) && modPerms.includes('view');
      }

      // Fallback to can permission check
      if (item.module) {
        return can(item.module, 'view');
      }
      return false;
    });

    const groups: { name: string; items: NavItem[] }[] = [];
    filtered.forEach((item) => {
      const categoryName = item.category ?? '';
      let existing = groups.find((c) => c.name === categoryName);
      if (!existing) {
        existing = { name: categoryName, items: [] };
        groups.push(existing);
      }
      existing.items.push(item);
    });

    return groups;
  }, [navItems, can, activeUser, isOwner, isStaffMember]);

  const storeName = tenant.name?.trim() || '';
  const logoUrl = tenant.logoUrl?.trim() || '';

  return (
    <div className="flex h-full flex-col bg-canvas text-ink select-none">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4 shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName || 'Store logo'}
            className="h-8 w-8 shrink-0 rounded-md object-contain"
          />
        ) : storeName ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink font-display text-lg font-medium text-canvas shrink-0">
            {storeName.charAt(0)}
          </span>
        ) : null}
        {storeName ? (
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink leading-tight">
            {storeName}
          </p>
        ) : (
          <span className="flex-1" />
        )}
        <Link
          href="/"
          className="rounded p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
          aria-label="View store"
          title="View store"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* Navigation Groups & Items */}
      <nav aria-label="Admin Navigation" className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-none">
        {categories.map((group) => (
          <div key={group.name || 'main'} className="mb-4">
            {group.name ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted/80">
                {group.name}
              </p>
            ) : null}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = getIconComponent(item.icon);
                const isChildActive = Boolean(
                  item.children?.some(
                    (child) =>
                      pathname === child.href ||
                      (child.href !== '/admin' && pathname.startsWith(`${child.href}/`))
                  )
                );
                const isExactActive =
                  item.end
                    ? pathname === item.href
                    : pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

                const isActive = isExactActive;
                const expanded = Boolean(item.children) && (isExactActive || isChildActive);
                const isParentActive = isActive && !isChildActive;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg pl-3.5 pr-3 py-2 text-sm border transition-all duration-150',
                        isParentActive
                          ? 'bg-surface font-semibold text-clay shadow-xs border-clay/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:rounded-r-full before:bg-clay'
                          : expanded
                            ? 'bg-subtle/70 font-semibold text-ink border-transparent'
                            : 'border-transparent text-ink-soft hover:bg-subtle/80 hover:text-ink font-medium'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isParentActive
                            ? 'text-clay stroke-[2.2]'
                            : expanded
                              ? 'text-ink stroke-[2]'
                              : 'text-ink-muted group-hover:text-ink'
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums leading-none transition-colors',
                            isParentActive
                              ? 'bg-clay text-white shadow-xs'
                              : 'bg-subtle text-ink-muted group-hover:bg-line group-hover:text-ink'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Expandable sub-items if present */}
                    {expanded && item.children && (
                      <ul className="ml-5 mt-1 space-y-1 border-l-2 border-line pl-3">
                        {item.children.map((child) => {
                          const isSubChildActive =
                            pathname === child.href ||
                            (child.href !== '/admin' && pathname.startsWith(`${child.href}/`));
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onItemClick}
                                className={cn(
                                  'group/child flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs sm:text-sm border transition-all duration-150',
                                  isSubChildActive
                                    ? 'bg-surface font-semibold text-clay shadow-xs border-clay/25'
                                    : 'border-transparent text-ink-muted hover:bg-subtle/80 hover:text-ink font-medium'
                                )}
                              >
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full shrink-0 transition-colors',
                                    isSubChildActive
                                      ? 'bg-clay ring-2 ring-clay/20'
                                      : 'bg-ink-muted/30 group-hover/child:bg-ink-muted'
                                  )}
                                />
                                <span className="truncate">{child.title}</span>
                                {child.badge !== undefined && (
                                  <span
                                    className={cn(
                                      'ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none',
                                      isSubChildActive
                                        ? 'bg-clay text-white shadow-2xs'
                                        : 'bg-subtle text-ink-muted group-hover/child:bg-line group-hover/child:text-ink'
                                    )}
                                  >
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-full shrink-0 items-center gap-2 border-t border-line px-4 py-3 text-xs font-medium text-ink-soft hover:bg-subtle hover:text-clay transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5 text-ink-muted group-hover:text-clay transition-colors" />
        <span className="truncate">Live Storefront</span>
      </Link>
    </div>
  );
}
