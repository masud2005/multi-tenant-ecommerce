'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { campaigns, automations as seedAuto } from '@/data/admin';
import { useAdmin } from '@/contexts/AdminContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { formatBDT, formatDate } from '@/utils/format';

type Tab = 'campaigns' | 'automations';

export default function AdminMarketingPage() {
  const { can } = useAdmin();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [autos, setAutos] = useState(seedAuto);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState('Email');

  return (
    <ModuleGate module="marketing">
      <div className="w-full space-y-6">
        <PageHeader
          title="Marketing"
          description="Campaigns and automated recovery flows. Only customers who opted in are contacted."
          actions={
            <GuardedButton
              module="marketing"
              action="create"
              size="sm"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden /> New campaign
            </GuardedButton>
          }
        />
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Attributed revenue · 30d', formatBDT(1658000)],
            ['Subscribers', '18,420'],
            ['Avg. open rate', '38.2%'],
            ['Recovered carts', '184'],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-lg border border-line bg-surface px-4 py-3"
            >
              <p className="text-xs text-ink-muted">{l}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{v}</p>
            </div>
          ))}
        </div>
        <div className="mb-6">
          <Tabs
            value={tab}
            onChange={(val) => setTab(val as Tab)}
            tabs={[
              { value: 'campaigns', label: 'Campaigns' },
              { value: 'automations', label: 'Automations' },
            ]}
          />
        </div>

        {tab === 'campaigns' && (
          <Panel flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-muted">
                    <th className="px-5 py-2.5 font-medium">Campaign</th>
                    <th className="px-3 py-2.5 font-medium">Audience</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 text-right font-medium">Open</th>
                    <th className="px-3 py-2.5 text-right font-medium">Click</th>
                    <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-subtle/30">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-xs text-ink-muted">
                          {c.channel} · utm_campaign={c.utm}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{c.audience}</td>
                      <td className="px-3 py-3">
                        <Badge
                          tone={
                            c.status === 'sent'
                              ? 'success'
                              : c.status === 'scheduled'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {c.status === 'scheduled'
                            ? `Scheduled ${formatDate(c.sent)}`
                            : c.status === 'sent'
                            ? `Sent ${formatDate(c.sent)}`
                            : 'Draft'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink">
                        {c.openRate ? `${c.openRate}%` : '—'}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink">
                        {c.clickRate ? `${c.clickRate}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-ink">
                        {c.revenue ? formatBDT(c.revenue) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === 'automations' && (
          <Panel flush>
            <ul className="divide-y divide-line">
              {autos.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-subtle/30"
                >
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink-muted">
                      When: {a.trigger} · {a.channel}
                    </p>
                  </div>
                  <p className="w-40 text-right text-sm text-ink-muted">
                    {a.revenue
                      ? `${a.recovered} orders · ${formatBDT(a.revenue)}`
                      : '—'}
                  </p>
                  <Switch
                    checked={a.enabled}
                    disabled={!can('marketing', 'update')}
                    onChange={(v) => {
                      setAutos((x) =>
                        x.map((y) => (y.id === a.id ? { ...y, enabled: v } : y))
                      );
                      toast.success(`${a.name} ${v ? 'enabled' : 'paused'}`);
                    }}
                    label={`Toggle ${a.name}`}
                    hideLabel
                  />
                </li>
              ))}
            </ul>
          </Panel>
        )}


        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size="lg"
          title="New campaign"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  toast.success('Saved as draft');
                }}
              >
                Save draft
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  toast.success('Campaign scheduled');
                }}
              >
                Schedule
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Campaign name" placeholder="Puja preview — early access" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                options={['Email', 'SMS', 'Push', 'Email + SMS']}
              />
              <Select
                label="Audience"
                options={[
                  'All subscribers · 18,420',
                  'VIP · 1,120',
                  'Loyal · 3,090',
                  'At risk · 1,280',
                  'Wishlisted Heritage Weaves · 2,210',
                ]}
              />
            </div>
            {channel.includes('Email') && (
              <Input
                label="Subject line"
                placeholder="Your early access to the Puja edit"
              />
            )}
            <Textarea
              label={channel === 'SMS' ? 'SMS text (160 chars)' : 'Message'}
              rows={4}
              maxLength={channel === 'SMS' ? 160 : undefined}
              placeholder={
                channel === 'SMS'
                  ? 'Eid sale Fri — code EID500 for ৳500 off. Shop: tanti.com.bd'
                  : 'e.g. Eid sale starts Friday — use code EID500 for ৳500 off orders over ৳3,000.'
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Send at"
                type="datetime-local"
                defaultValue="2026-09-29T10:00"
                placeholder="2026-09-29 10:00"
              />
              <Input
                label="UTM campaign"
                defaultValue="puja26_preview"
                placeholder="e.g. eid26_sale"
              />
            </div>
          </div>
        </Modal>
      </div>
    </ModuleGate>
  );
}
