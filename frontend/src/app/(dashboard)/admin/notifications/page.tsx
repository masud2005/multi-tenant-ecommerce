'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  Bell,
  Search,
  SlidersHorizontal,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/format';
import {
  NotificationTemplate,
  NotificationChannel,
  initialNotificationTemplates,
} from './data';
import { NotificationTemplateDrawer } from './NotificationTemplateDrawer';
import { notificationService, NotificationItem } from '@/services/notification-service';

type FilterGroup = 'All' | 'Orders' | 'Shipping' | 'Inventory' | 'Returns' | 'Staff' | 'Reviews';

export default function AdminNotificationsPage() {
  const { can } = useAdmin();
  const editable = can('notifications', 'update');

  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialNotificationTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Real database notifications logs
  const [realLogs, setRealLogs] = useState<NotificationItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsUnreadOnly, setLogsUnreadOnly] = useState<boolean>(false);

  // Search and group filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<FilterGroup>('All');

  const fetchRealLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await notificationService.getNotifications({
        limit: 50,
        unreadOnly: logsUnreadOnly ? true : undefined,
      });
      setRealLogs(res.items || []);
    } catch (err) {
      console.error('Failed to load real logs:', err);
      toast.error('Failed to load notification logs');
    } finally {
      setLogsLoading(false);
    }
  }, [logsUnreadOnly]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchRealLogs();
    }
  }, [activeTab, fetchRealLogs]);

  const editingTemplate = useMemo(
    () => templates.find((t) => t.id === editingId) || null,
    [templates, editingId]
  );

  // Filtered template items
  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      const matchesSearch =
        item.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === 'All' || item.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [templates, searchQuery, selectedGroup]);

  // Channel toggles (Email and In-App)
  const toggleChannel = (id: string, channel: NotificationChannel, enabled: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, [channel]: enabled };
          toast.success(
            `${t.event} ${channel === 'email' ? 'Email' : 'In-App'} notifications ${
              enabled ? 'enabled' : 'disabled'
            }`
          );
          return updated;
        }
        return t;
      })
    );
  };

  // Save template from drawer
  const handleSaveTemplate = (updated: NotificationTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  // Channel stats count
  const emailActiveCount = templates.filter((t) => t.email).length;
  const inAppActiveCount = templates.filter((t) => t.inApp).length;

  return (
    <ModuleGate module="notifications">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Notifications & Alerts"
          description="Manage real-time In-App bell notifications and transactional email alerts for store events."
        />

        {/* Global Channel Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel className="p-4 flex items-center justify-between border-line bg-surface">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-clay/10 text-clay">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">In-App Live Bell</p>
                <p className="text-xs text-ink-muted">
                  Real-time dropdown alerts on store & dashboard headers
                </p>
              </div>
            </div>
            <Badge tone="neutral" className="bg-canvas text-ink text-xs px-2.5 py-1">
              {inAppActiveCount} / {templates.length} Active
            </Badge>
          </Panel>

          <Panel className="p-4 flex items-center justify-between border-line bg-surface">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-clay/10 text-clay">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Email Notifications</p>
                <p className="text-xs text-ink-muted">
                  Transactional order confirmation & status updates
                </p>
              </div>
            </div>
            <Badge tone="neutral" className="bg-canvas text-ink text-xs px-2.5 py-1">
              {emailActiveCount} / {templates.length} Active
            </Badge>
          </Panel>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-line pb-1">
          <Tabs<'templates' | 'logs'>
            tabs={[
              { value: 'templates', label: 'Event Templates & Channels' },
              { value: 'logs', label: 'Live Notification Activity' },
            ]}
            value={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* Tab 1: Notification Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search event triggers..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-clay/20 focus:border-clay"
                />
              </div>

              {/* Group Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['All', 'Orders', 'Shipping', 'Inventory', 'Returns', 'Staff', 'Reviews'] as FilterGroup[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedGroup === grp
                        ? 'bg-clay text-white font-semibold'
                        : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-subtle'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Table Panel */}
            <Panel className="overflow-hidden border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Event Trigger</th>
                      <th className="px-4 py-3.5 font-semibold">Category</th>
                      <th className="px-4 py-3.5 font-semibold text-center">In-App Bell</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Email</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-ink text-sm flex items-center gap-2">
                              {template.event}
                            </p>
                            <p className="text-xs text-ink-muted mt-0.5 max-w-md line-clamp-1">
                              {template.description}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge tone="neutral" className="text-xs">
                            {template.group}
                          </Badge>
                        </td>

                        {/* In-App Bell Toggle */}
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <Switch
                              checked={template.inApp}
                              onChange={(checked: boolean) =>
                                toggleChannel(template.id, 'inApp', checked)
                              }
                              label={`Toggle In-App for ${template.event}`}
                              hideLabel
                              disabled={!editable}
                            />
                          </div>
                        </td>

                        {/* Email Toggle */}
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <Switch
                              checked={template.email}
                              onChange={(checked: boolean) =>
                                toggleChannel(template.id, 'email', checked)
                              }
                              label={`Toggle Email for ${template.event}`}
                              hideLabel
                              disabled={!editable}
                            />
                          </div>
                        </td>

                        {/* Customize Template Button */}
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingId(template.id)}
                            className="text-xs border-line hover:border-clay hover:text-clay"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                            Customize
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredTemplates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-ink-muted">
                          No matching notification triggers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* Tab 2: Live Activity & Logs (Real Database Records) */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchRealLogs}
                  disabled={logsLoading}
                  className="text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                  Refresh Live Logs
                </Button>

                <button
                  type="button"
                  onClick={() => setLogsUnreadOnly(!logsUnreadOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    logsUnreadOnly
                      ? 'bg-clay text-white border-clay'
                      : 'bg-surface border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  {logsUnreadOnly ? 'Showing Unread Only' : 'All Notifications'}
                </button>
              </div>

              <span className="text-xs text-ink-muted">
                Showing {realLogs.length} recent live database notification records
              </span>
            </div>

            <Panel className="overflow-hidden border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Title & Details</th>
                      <th className="px-4 py-3.5 font-semibold">Type</th>
                      <th className="px-4 py-3.5 font-semibold">Target Link</th>
                      <th className="px-4 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-ink-muted">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-clay" />
                            <span className="text-xs">Fetching real-time notifications from database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : realLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-ink-muted">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Bell className="h-8 w-8 text-ink-muted/30" />
                            <p className="text-sm font-medium text-ink">No live notifications found</p>
                            <p className="text-xs text-ink-muted">
                              When real orders or events trigger, they will be logged here in real-time.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      realLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-canvas/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-ink text-sm flex items-center gap-1.5">
                                {!log.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-clay shrink-0" />
                                )}
                                {log.title}
                              </p>
                              <p className="text-xs text-ink-muted mt-0.5">{log.message}</p>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge tone="neutral" className="text-xs uppercase font-mono">
                              {log.type}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5">
                            {log.link ? (
                              <Link
                                href={log.link}
                                className="text-xs text-clay hover:underline flex items-center gap-1"
                              >
                                {log.link}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-xs text-ink-muted">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            {log.isRead ? (
                              <Badge tone="neutral" className="text-xs text-ink-muted bg-canvas">
                                Read
                              </Badge>
                            ) : (
                              <Badge tone="clay" className="text-xs font-semibold">
                                Unread
                              </Badge>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right text-xs text-ink-muted whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* Customize Drawer */}
        <NotificationTemplateDrawer
          template={editingTemplate}
          open={Boolean(editingId)}
          onClose={() => setEditingId(null)}
          onSave={handleSaveTemplate}
          editable={editable}
        />
      </div>
    </ModuleGate>
  );
}
