'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  User,
  Mail,
  Phone,
  Hash,
  Filter,
  RefreshCw,
  Check,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import {
  supportService,
  SupportTicketItem,
} from '@/services/support-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

const statusTones: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: 'neutral',
};

export default function AdminMessagesPage() {
  const { can } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await supportService.getTickets({
        status: statusFilter,
        search: search.trim() || undefined,
      });
      if (res && res.data) {
        setTickets(res.data.tickets || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setIsReplying(true);
      const res = await supportService.replyToTicket(
        selectedTicket.id,
        replyText.trim()
      );
      if (res && res.data) {
        setSelectedTicket(res.data);
        setReplyText('');
        toast.success('Reply sent to customer inquiry');
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const res = await supportService.updateTicketStatus(
        selectedTicket.id,
        newStatus
      );
      if (res && res.data) {
        setSelectedTicket(res.data);
        toast.success(`Ticket marked as ${newStatus}`);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  return (
    <ModuleGate module="customers">
      <div className="w-full space-y-6">
        <PageHeader
          title="Customer Inquiries & Messages"
          description="View, manage, and reply to inquiries received from the Contact Us desk."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchTickets}
              className="cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
          }
        />

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5 border-b border-line pb-2 sm:border-0 sm:pb-0">
            {(
              [
                ['all', 'All', counts.all],
                ['open', 'Open (New)', counts.open],
                ['pending', 'Pending / In Progress', counts.pending],
                ['resolved', 'Resolved', counts.resolved],
                ['closed', 'Closed', counts.closed],
              ] as const
            ).map(([id, label, count]) => {
              const active = statusFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                    active
                      ? 'bg-ink text-canvas shadow-sm font-semibold'
                      : 'text-ink-soft hover:bg-subtle hover:text-ink'
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px]',
                      active
                        ? 'bg-canvas/20 text-canvas'
                        : 'bg-subtle text-ink-muted'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, topic..."
                className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="cursor-pointer">
              Search
            </Button>
          </form>
        </div>

        {/* Ticket List Panel */}
        <Panel flush>
          {isLoading ? (
            <div className="py-16 text-center text-sm text-ink-muted">
              Loading customer inquiries...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-ink-muted/40" />
              <h3 className="mt-3 text-base font-semibold text-ink">
                No customer inquiries found
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                {search
                  ? 'No messages matching your search criteria.'
                  : 'New messages from the Contact Us form will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {tickets.map((t) => {
                const lastMsg =
                  t.messages[t.messages.length - 1] || t.messages[0];
                const tone = statusTones[t.status] || 'neutral';
                return (
                  <li
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-subtle/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-sm">
                        {(t.customer?.name || 'C').slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-ink truncate">
                            {t.customer?.name || 'Customer'}
                          </p>
                          <span className="text-xs text-ink-muted">
                            ({t.customer?.email})
                          </span>
                          {t.customer?.phone && (
                            <span className="text-xs text-emerald-600 font-medium">
                              📱 {t.customer.phone}
                            </span>
                          )}
                          <Badge tone={tone} className="capitalize">
                            {t.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-medium text-clay">
                          Topic: {t.subject}
                          {t.orderNumber && (
                            <span className="ml-2 font-mono text-ink-muted">
                              Order #{t.orderNumber}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft line-clamp-1">
                          {lastMsg?.text || 'No message content'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0 text-xs text-ink-muted">
                      <span>{formatDate(t.createdAt)}</span>
                      <span className="text-[11px] font-mono">
                        {t.messages.length} message
                        {t.messages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Conversation Thread Modal */}
        {selectedTicket && (
          <Modal
            open={!!selectedTicket}
            onClose={() => setSelectedTicket(null)}
            title={`Inquiry: ${selectedTicket.subject}`}
            description={`Ticket Ref: #${selectedTicket.id.slice(0, 8).toUpperCase()} · Created ${formatDate(selectedTicket.createdAt)}`}
          >
            <div className="space-y-6">
              {/* Customer Quick Info Card */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-subtle/30 p-3 text-xs">
                <div>
                  <span className="text-ink-muted">Customer Name:</span>
                  <p className="font-semibold text-ink">
                    {selectedTicket.customer?.name}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">Email:</span>
                  <p className="font-semibold text-ink truncate">
                    <a
                      href={`mailto:${selectedTicket.customer?.email}`}
                      className="hover:underline"
                    >
                      {selectedTicket.customer?.email}
                    </a>
                  </p>
                </div>
                {selectedTicket.customer?.phone && (
                  <div>
                    <span className="text-ink-muted">Phone / WhatsApp:</span>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      <a
                        href={`https://wa.me/${selectedTicket.customer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {selectedTicket.customer.phone} ↗
                      </a>
                    </p>
                  </div>
                )}
                {selectedTicket.orderNumber && (
                  <div>
                    <span className="text-ink-muted">Referenced Order:</span>
                    <p className="font-mono font-semibold text-ink">
                      #{selectedTicket.orderNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Update Pill Bar */}
              <div className="flex items-center justify-between border-y border-line py-2.5 text-xs">
                <span className="font-medium text-ink-muted">Status:</span>
                <div className="flex gap-1.5">
                  {(['open', 'pending', 'resolved', 'closed'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all cursor-pointer',
                          selectedTicket.status === st
                            ? 'bg-ink text-canvas font-semibold shadow-sm'
                            : 'bg-subtle text-ink-soft hover:text-ink'
                        )}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Message Thread History */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedTicket.messages.map((m) => {
                  const isAgent = m.from === 'agent';
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex flex-col rounded-xl p-3.5 text-xs shadow-sm max-w-[85%]',
                        isAgent
                          ? 'ml-auto bg-ink text-canvas'
                          : 'mr-auto bg-[#EFEAE2]/60 dark:bg-stone-800 text-ink border border-line'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-bold">
                          {isAgent ? `🛡️ ${m.name} (Store Staff)` : `👤 ${m.name}`}
                        </span>
                        <span className={cn('text-[10px]', isAgent ? 'text-canvas/60' : 'text-ink-muted')}>
                          {formatDate(m.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="space-y-2 border-t border-line pt-4">
                <label className="block text-xs font-semibold text-ink">
                  Reply to Customer
                </label>
                <Textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official response to the customer..."
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                    className="cursor-pointer"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    loading={isReplying}
                    onClick={handleReply}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </ModuleGate>
  );
}
