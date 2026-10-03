'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { notificationTemplates, notificationLogs } from '@/data/admin';
import { useAdmin } from '@/contexts/AdminContext';
import { authService } from '@/services/auth';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/format';

type Channel = 'email' | 'sms' | 'push';
const channels: Channel[] = ['email', 'sms', 'push'];

export default function AdminNotificationsPage() {
  const { can } = useAdmin();
  const editable = can('notifications', 'update');
  const [tab, setTab] = useState<'templates' | 'logs'>('templates');
  const [tpls, setTpls] = useState(notificationTemplates);
  const [editing, setEditing] = useState<string | null>(null);
  const tpl = tpls.find((t) => t.id === editing);

  const toggle = (id: string, ch: Channel, v: boolean) =>
    setTpls((x) =>
      x.map((t) => (t.id === id ? { ...t, [ch]: v } : t))
    );

  return (
    <ModuleGate module="notifications">
      <div className="w-full space-y-6">
        <PageHeader
          title="Notifications"
          description="Choose which events send an email, SMS or push, and edit the message templates."
        />
        <div className="mb-6">
          <Tabs
            value={tab}
            onChange={(val) => setTab(val as typeof tab)}
            tabs={[
              { value: 'templates', label: 'Customer notifications' },
              { value: 'logs', label: 'Delivery log' },
            ]}
          />
        </div>
        {tab === 'templates' ? (
          <Panel flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-muted">
                    <th className="px-5 py-2.5 font-medium">Event</th>
                    <th className="px-3 py-2.5 text-center font-medium">Email</th>
                    <th className="px-3 py-2.5 text-center font-medium">SMS</th>
                    <th className="px-3 py-2.5 text-center font-medium">Push</th>
                    <th className="px-5 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tpls.map((t) => (
                    <tr key={t.id} className="hover:bg-subtle/30">
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-ink">{t.event}</p>
                        <p className="text-xs text-ink-muted">{t.group}</p>
                      </td>
                      {channels.map((ch) => (
                        <td key={ch} className="px-3 py-2.5">
                          <div className="flex justify-center">
                            <Switch
                              checked={t[ch]}
                              disabled={!editable}
                              onChange={(v) => toggle(t.id, ch, v)}
                              label={`${t.event} ${ch}`}
                              hideLabel
                            />
                          </div>
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(t.id)}
                        >
                          Edit template
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : (
          <Panel flush>
            <ul className="divide-y divide-line">
              {notificationLogs.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-3 text-sm hover:bg-subtle/30"
                >
                  <span className="w-32 text-xs text-ink-muted">
                    {formatDateTime(l.at)}
                  </span>
                  <Badge>{l.channel}</Badge>
                  <span className="flex-1 text-ink">
                    {l.event} → {l.to}
                  </span>
                  <Badge tone={l.status === 'failed' ? 'danger' : 'success'}>
                    {l.status}
                  </Badge>
                  {l.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success('Message re-sent')}
                    >
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Drawer
          open={!!tpl}
          onClose={() => setEditing(null)}
          width="max-w-lg"
          title={tpl?.event ?? ''}
          subtitle="Variables: {{customer_name}} {{order_number}} {{total}} {{tracking_url}}"
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  const currentUser = authService.getStoredUser();
                  const targetEmail = currentUser?.email || 'owner@store.com';
                  toast.success(`Test sent to ${targetEmail}`);
                }}
              >
                Send test
              </Button>
              <Button
                disabled={!editable}
                onClick={() => {
                  setEditing(null);
                  toast.success('Template saved');
                }}
              >
                Save
              </Button>
            </div>
          }
        >
          {tpl && (
            <div className="space-y-4 px-5 py-5">
              <Input
                label="Email subject"
                defaultValue={`${tpl.event} — order {{order_number}}`}
              />
              <Textarea
                label="Email body"
                rows={6}
                defaultValue={`Hi {{customer_name}},\n\nThis is an update about your order {{order_number}} ({{total}}).\n\nTrack it here: {{tracking_url}}\n\n— Tanti`}
              />
              <Textarea
                label="SMS (160 chars)"
                rows={2}
                maxLength={160}
                defaultValue={`Tanti: ${tpl.event} for {{order_number}}. Track: {{tracking_url}}`}
              />
            </div>
          )}
        </Drawer>
      </div>
    </ModuleGate>
  );
}
