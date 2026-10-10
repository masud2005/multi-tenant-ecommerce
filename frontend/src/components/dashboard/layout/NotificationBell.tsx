'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Check, Loader2 } from 'lucide-react';
import type { UserInfo } from '@/types/user';
import { notificationService, NotificationItem } from '@/services/notification-service';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

interface NotificationBellProps {
  user?: UserInfo;
}

export function NotificationBell({}: NotificationBellProps = {}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 15 });
      setNotifications(res.items || []);
      setUnreadCount(res.meta?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh every 20 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationService.markAsRead(item.id);
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative rounded-md p-2 hover:bg-subtle text-ink cursor-pointer transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface shadow-sm animate-in zoom-in-50 duration-150"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-84 sm:w-96 rounded-lg border border-line bg-surface shadow-pop animate-in fade-in-0 slide-in-from-top-1 duration-150 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-surface">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              {unreadCount > 0 && (
                <span className="rounded-full bg-clay/10 text-clay px-2 py-0.5 text-xs font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-xs font-medium text-clay hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-line">
            {loading && notifications.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-8 text-ink-muted">
                <Loader2 className="h-5 w-5 animate-spin mb-2 text-clay" />
                <span className="text-xs">Loading notifications...</span>
              </li>
            ) : notifications.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="h-8 w-8 text-ink-muted/40 mb-2" />
                <p className="text-sm font-medium text-ink">No notifications yet</p>
                <p className="text-xs text-ink-muted mt-1">
                  When new orders or updates arrive, you'll see them here.
                </p>
              </li>
            ) : (
              notifications.map((n) => {
                const targetLink = n.link || '/admin';
                return (
                  <li key={n.id} className={!n.isRead ? 'bg-clay/5' : ''}>
                    <Link
                      href={targetLink}
                      onClick={() => handleMarkAsRead(n)}
                      className="block px-4 py-3 hover:bg-canvas transition-colors relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-ink leading-snug flex items-center gap-1.5">
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-clay shrink-0" />
                            )}
                            <span className="truncate">{n.title}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <span className="mt-1.5 block text-[11px] text-ink-muted/80">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-line px-4 py-2.5 text-center bg-canvas/40">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
            >
              View notification settings & history →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
