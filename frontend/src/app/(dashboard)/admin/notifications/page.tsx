'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Mail,
  Bell,
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
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
  initialDeliveryLogs,
  DeliveryLogItem
} from './data';
import { NotificationTemplateDrawer } from './NotificationTemplateDrawer';

type FilterGroup = 'All' | 'Orders' | 'Payments' | 'Shipping' | 'Returns' | 'Account';

export default function AdminNotificationsPage() {
  const { can } = useAdmin();
  const editable = can('notifications', 'update');

  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialNotificationTemplates);
  const [logs, setLogs] = useState<DeliveryLogItem[]>(initialDeliveryLogs);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and group filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<FilterGroup>('All');

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

  // Channel toggles (Only Email and Push)
  const toggleChannel = (id: string, channel: NotificationChannel, enabled: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, [channel]: enabled };
          toast.success(
            `${t.event} ${channel === 'email' ? 'Email' : 'Push'} notifications ${
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
  const pushActiveCount = templates.filter((t) => t.push).length;

  return (
    <ModuleGate module="notifications">
      <div className="w-full space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Notifications"
          description="Choose which events send an email or push notification, and edit the message templates."
          meta={
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-subtle text-ink-muted">
                <Mail className="h-3.5 w-3.5 text-clay" />
                {emailActiveCount} Email active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-subtle text-ink-muted">
                <Bell className="h-3.5 w-3.5 text-clay" />
                {pushActiveCount} Push active
              </span>
            </div>
          }
        />

        {/* Primary Page Navigation Tabs */}
        <div>
          <Tabs
            value={activeTab}
            onChange={(val) => setActiveTab(val as typeof activeTab)}
            tabs={[
              { value: 'templates', label: 'Customer notifications', count: templates.length },
              { value: 'logs', label: 'Delivery log', count: logs.length },
            ]}
          />
        </div>

        {activeTab === 'templates' ? (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search events (e.g. Order, Payment)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20 transition-all"
                />
              </div>

              {/* Group Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(['All', 'Orders', 'Payments', 'Shipping', 'Returns', 'Account'] as FilterGroup[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedGroup === grp
                        ? 'bg-ink text-canvas font-semibold'
                        : 'bg-surface text-ink-muted border border-line hover:text-ink hover:border-line-strong'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Table */}
            <Panel flush>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-subtle/20 text-left text-xs font-medium text-ink-muted">
                      <th className="px-5 py-3 font-semibold text-ink">Event</th>
                      <th className="px-4 py-3 text-center font-semibold text-ink w-32">
                        <div className="flex items-center justify-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-clay" />
                          <span>Email</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-ink w-32">
                        <div className="flex items-center justify-center gap-1.5">
                          <Bell className="h-3.5 w-3.5 text-clay" />
                          <span>Push</span>
                        </div>
                      </th>
                      <th className="px-5 py-3 text-right font-semibold text-ink w-36">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-ink-muted text-sm">
                          No notification events found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-subtle/40 transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-baseline gap-2">
                              <p className="font-medium text-ink group-hover:text-clay transition-colors">
                                {t.event}
                              </p>
                              <span className="text-[11px] font-medium text-ink-muted/80 bg-subtle/70 px-1.5 py-0.5 rounded">
                                {t.group}
                              </span>
                            </div>
                            <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                              {t.description}
                            </p>
                          </td>

                          {/* Email Channel Toggle */}
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
                              <Switch
                                checked={t.email}
                                disabled={!editable}
                                onChange={(val) => toggleChannel(t.id, 'email', val)}
                                label={`${t.event} Email`}
                                hideLabel
                              />
                            </div>
                          </td>

                          {/* Push Channel Toggle */}
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
                              <Switch
                                checked={t.push}
                                disabled={!editable}
                                onChange={(val) => toggleChannel(t.id, 'push', val)}
                                label={`${t.event} Push`}
                                hideLabel
                              />
                            </div>
                          </td>

                          {/* Edit Template Action Button */}
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(t.id)}
                              className="text-xs font-medium hover:text-clay hover:bg-clay/10 transition-colors"
                            >
                              Edit template
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        ) : (
          /* Delivery Log Tab */
          <Panel flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-subtle/20 text-left text-xs font-semibold text-ink-muted">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-5 py-3">Event &amp; Recipient</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-subtle/30 transition-colors">
                      <td className="px-5 py-3 text-xs text-ink-muted whitespace-nowrap">
                        {formatDateTime(l.at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-subtle text-ink">
                          {l.channel === 'Email' ? (
                            <Mail className="h-3 w-3 text-clay" />
                          ) : (
                            <Bell className="h-3 w-3 text-clay" />
                          )}
                          {l.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{l.event}</span>
                          <span className="text-xs text-ink-muted">→</span>
                          <span className="text-xs font-mono text-ink-soft">{l.to}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          tone={
                            l.status === 'failed'
                              ? 'danger'
                              : l.status === 'opened'
                              ? 'info'
                              : 'success'
                          }
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {l.status === 'failed' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLogs((prev) =>
                                prev.map((item) =>
                                  item.id === l.id ? { ...item, status: 'delivered' } : item
                                )
                              );
                              toast.success(`Message re-sent to ${l.to}`);
                            }}
                            className="text-xs text-danger hover:text-danger-dark"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Retry
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* Edit Template Drawer */}
        <NotificationTemplateDrawer
          template={editingTemplate}
          open={!!editingId}
          onClose={() => setEditingId(null)}
          onSave={handleSaveTemplate}
          editable={editable}
        />
      </div>
    </ModuleGate>
  );
}
