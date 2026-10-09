'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcwIcon,
  RefreshCw,
  Loader2,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { returnService } from '@/services/return-service';
import { AccountHeader } from '@/components/account/AccountHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { returnStatusMeta } from '@/utils/status';
import { formatBDT, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { ReturnRequest, ReturnStatus } from '@/types/commerce';

const flow: ReturnStatus[] = [
  'requested',
  'approved',
  'in_transit',
  'received',
  'exchanged',
];

export default function AccountReturnsPage() {
  const { user } = useStore();
  const [returnsList, setReturnsList] = useState<
    (ReturnRequest & { photoUrls?: string[]; order?: any })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  // Fetch real customer returns from backend
  const fetchCustomerReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await returnService.getCustomerReturns();
      if (res?.data && Array.isArray(res.data)) {
        setReturnsList(res.data);
      } else {
        setReturnsList([]);
      }
    } catch (err) {
      console.warn('Could not load customer returns:', err);
      setReturnsList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerReturns();
  }, [fetchCustomerReturns]);

  const toggleTimeline = (id: string) => {
    setExpandedTimelineId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <AccountHeader
        title="Returns & Exchanges"
        description="Track the real-time status and timeline of your product return and exchange requests."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCustomerReturns}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button variant="secondary" size="sm" href="/account/orders">
              Start a Return
            </Button>
          </div>
        }
      />

      {/* Loading Skeleton */}
      {isLoading && returnsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-clay mb-2" />
          <p className="text-sm text-ink-muted">Loading your return requests...</p>
        </div>
      ) : returnsList.length === 0 ? (
        <EmptyState
          icon={RotateCcwIcon}
          title="No return or exchange requests found"
          description="You can start an exchange from any delivered order within 7 days."
          action={
            <Button href="/account/orders" variant="secondary" size="sm">
              View My Orders
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {returnsList.map((r) => {
            const isRejected = r.status === 'rejected';
            const stepIdx = r.status === 'refunded' ? 4 : flow.indexOf(r.status);
            const isExpanded = expandedTimelineId === r.id;

            return (
              <li
                key={r.id}
                className="rounded-xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">
                        Exchange #{r.id.length > 12 ? r.id.slice(0, 8) : r.id}
                      </span>
                      <span className="text-ink-muted text-xs">·</span>
                      <Link
                        href={`/account/orders/${r.orderNumber}`}
                        className="text-xs font-medium text-clay hover:underline inline-flex items-center gap-1"
                      >
                        Order #{r.orderNumber} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Submitted on {formatDate(r.createdAt)} · Reason:{' '}
                      <b className="text-ink font-medium">{r.reason}</b>
                    </p>
                  </div>
                  <Badge
                    tone={returnStatusMeta[r.status]?.tone || 'neutral'}
                    dot
                  >
                    {r.status === 'exchanged' || r.status === 'refunded'
                      ? 'Exchanged'
                      : returnStatusMeta[r.status]?.label || r.status}
                  </Badge>
                </div>

                {/* Items & Exchange Summary */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3 overflow-hidden">
                      {r.items.map((item, idx) =>
                        item.image ? (
                          <img
                            key={idx}
                            src={item.image}
                            alt=""
                            className="h-14 w-11 rounded-md object-cover border-2 border-surface shadow-xs"
                          />
                        ) : (
                          <div
                            key={idx}
                            className="h-14 w-11 rounded-md bg-canvas border-2 border-surface flex items-center justify-center text-[10px] text-ink-muted"
                          >
                            <Package className="h-4 w-4" />
                          </div>
                        ),
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-ink line-clamp-1">
                        {r.items.map((i) => `${i.title} (${i.qty})`).join(', ')}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Resolution:{' '}
                        <span className="font-semibold text-ink">
                          Doorstep Product & Size Exchange
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Item Value</p>
                    <p className="text-base font-bold text-ink tabular-nums">
                      {formatBDT(r.amount)}
                    </p>
                  </div>
                </div>

                {/* Live Progress Bar (Unless Rejected) */}
                {!isRejected ? (
                  <div className="mt-5 rounded-lg bg-canvas p-3.5 border border-line">
                    <ol
                      className="grid grid-cols-5 gap-2 text-xs"
                      aria-label="Exchange progress tracking"
                    >
                      {[
                        'Requested',
                        'Approved',
                        'In Transit',
                        'Inspected',
                        'Exchange Dispatched',
                      ].map((stepName, i) => {
                        const isDone = i <= stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                          <li key={stepName} className="flex flex-col gap-1.5">
                            <span
                              className={cn(
                                'h-1.5 rounded-full transition-colors',
                                isDone ? 'bg-clay' : 'bg-line-strong',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[11px] truncate',
                                isCurrent
                                  ? 'font-bold text-clay'
                                  : isDone
                                  ? 'font-medium text-ink'
                                  : 'text-ink-muted',
                              )}
                            >
                              {stepName}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>
                      This request was reviewed and rejected. Check inspection remarks below.
                    </span>
                  </div>
                )}

                {/* Inspection Note If Available */}
                {r.inspectionNote && (
                  <div className="mt-3 rounded-lg bg-canvas p-3 text-xs border border-line flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink">Store Inspection Note:</p>
                      <p className="text-ink-soft mt-0.5">{r.inspectionNote}</p>
                    </div>
                  </div>
                )}

                {/* Latest Status & Timeline Expand Toggle */}
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-ink-muted truncate">
                    <Clock className="h-3.5 w-3.5 text-clay shrink-0" />
                    <span className="truncate">
                      Latest: <b className="text-ink font-medium">{r.timeline[0]?.label || 'Request submitted'}</b>
                      {r.timeline[0]?.at && ` · ${formatDateTime(r.timeline[0].at)}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTimeline(r.id)}
                    className="inline-flex items-center gap-1 font-medium text-clay hover:underline cursor-pointer ml-2 shrink-0"
                  >
                    <span>{isExpanded ? 'Hide timeline' : 'View tracking timeline'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Expandable Live Audit Timeline */}
                {isExpanded && (
                  <div className="mt-4 rounded-lg bg-canvas p-4 border border-line animate-in fade-in-50 duration-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                      Complete Return & Exchange Timeline
                    </p>
                    <ol className="relative border-l border-line pl-4 space-y-3.5 text-xs">
                      {r.timeline.map((event, tIdx) => (
                        <li key={tIdx} className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-clay" />
                          <p className="font-semibold text-ink">{event.label}</p>
                          <p className="text-[11px] text-ink-muted">
                            {formatDateTime(event.at)} {event.by && `· by ${event.by}`}
                          </p>
                          {event.note && (
                            <p className="mt-1 text-ink-soft italic bg-surface p-2 rounded border border-line">
                              “{event.note}”
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
