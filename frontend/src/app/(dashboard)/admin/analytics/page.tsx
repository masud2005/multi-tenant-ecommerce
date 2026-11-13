'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCw } from 'lucide-react';
import {
  Area,
  ComposedChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { formatBDT, formatCompactBDT, formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import {
  analyticsService,
  DistrictSalesItem,
  SearchQueryItem,
} from '@/services/analytics-service';

const ranges = ['Today', '7 days', '30 days', '90 days'] as const;
const axisTick = { fontSize: 11, fill: '#8A8378' };

type KpiState = {
  orders: number;
  ordersDelta: string;
  aov: number;
  aovDelta: string;
  discounts: number;
  discountsDelta: string;
  returningRate: number;
  returningDelta: string;
  returningCustomers?: number;
  totalCustomers?: number;
  netSales: number;
  grossSales: number;
  salesDelta: string;
  conversionRate: number;
  conversionDelta: string;
  loggedInCustomers?: number;
  orderingCustomers?: number;
  shippingRevenue?: number;
  shippingDelta?: string;
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>('30 days');
  const [compare, setCompare] = useState(true);
  const [regionData, setRegionData] = useState<DistrictSalesItem[]>([]);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [searchesData, setSearchesData] = useState<SearchQueryItem[]>([]);
  const [isLoadingSearches, setIsLoadingSearches] = useState(false);
  const [seriesData, setSeriesData] = useState<
    { date: string; sales: number; prev: number; orders: number }[]
  >([]);
  const [realKpis, setRealKpis] = useState<KpiState | null>(null);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [overviewError, setOverviewError] = useState(false);

  // Fetch real database KPIs (Orders, AOV, Returning Customers, Discounts, Sales, District) whenever date range changes
  const fetchOverview = useCallback(
    async (selectedRange: (typeof ranges)[number], showLoader = false) => {
      try {
        if (showLoader) {
          setIsLoadingKpis(true);
          setIsLoadingRegion(true);
        }
        const overview = await analyticsService.getAnalyticsOverview(selectedRange);
        if (overview?.kpis) {
          setOverviewError(false);
          setRealKpis({
            orders: overview.kpis.orders,
            ordersDelta: overview.kpis.ordersDelta || '+0%',
            aov: overview.kpis.aov,
            aovDelta: overview.kpis.aovDelta || '+0%',
            discounts: overview.kpis.discounts,
            discountsDelta: overview.kpis.discountsDelta || '+0%',
            returningRate: overview.kpis.returningRate,
            returningDelta: overview.kpis.returningDelta || '+0 pt',
            returningCustomers: overview.kpis.returningCustomers,
            totalCustomers: overview.kpis.totalCustomers,
            netSales: overview.kpis.netSales,
            grossSales: overview.kpis.grossSales,
            salesDelta: overview.kpis.salesDelta || '+0%',
            conversionRate: overview.kpis.conversionRate ?? 0,
            conversionDelta: overview.kpis.conversionDelta || '+0 pt',
            loggedInCustomers: overview.kpis.loggedInCustomers,
            orderingCustomers: overview.kpis.orderingCustomers,
            shippingRevenue: overview.kpis.shippingRevenue,
            shippingDelta: overview.kpis.shippingDelta || '+0%',
          });
          setRegionData(
            Array.isArray(overview.salesByRegion) ? overview.salesByRegion : []
          );
          setSeriesData(
            Array.isArray(overview.salesSeries) ? overview.salesSeries : []
          );
        } else {
          setOverviewError(true);
          setRealKpis(null);
          setRegionData([]);
          setSeriesData([]);
        }
      } catch (err) {
        console.error('Failed to load real analytics overview:', err);
        setOverviewError(true);
        setRealKpis(null);
        setRegionData([]);
        setSeriesData([]);
      } finally {
        if (showLoader) {
          setIsLoadingKpis(false);
          setIsLoadingRegion(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchOverview(range, true);

    // Auto-refresh real KPIs every 5 seconds so live customer orders reflect dynamically
    const interval = setInterval(() => {
      fetchOverview(range, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [range, fetchOverview]);

  // Fetch real database top searches from PostgreSQL with auto-polling
  const fetchTopSearches = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsLoadingSearches(true);
      const data = await analyticsService.getTopSearches();
      if (Array.isArray(data)) {
        setSearchesData(data);
      }
    } catch (err) {
      console.error('Failed to load real top searches:', err);
    } finally {
      if (showLoader) setIsLoadingSearches(false);
    }
  }, []);

  useEffect(() => {
    fetchTopSearches(true);

    // Auto-refresh every 3 seconds so customer searches appear in real-time
    const interval = setInterval(() => {
      fetchTopSearches(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTopSearches]);

  const secondary: {
    label: string;
    value: string;
    delta: string;
    isReal: boolean;
    extra?: string;
  }[] = [
    {
      label: 'Orders',
      value: realKpis ? formatNumber(realKpis.orders) : '—',
      delta: realKpis ? realKpis.ordersDelta : '',
      isReal: Boolean(realKpis),
    },
    {
      label: 'Avg. order value',
      value: realKpis ? formatBDT(realKpis.aov) : '—',
      delta: realKpis ? realKpis.aovDelta : '',
      isReal: Boolean(realKpis),
    },
    {
      label: 'Conversion rate',
      value: realKpis ? `${realKpis.conversionRate}%` : '—',
      delta: realKpis ? realKpis.conversionDelta : '',
      isReal: Boolean(realKpis),
      extra:
        realKpis && realKpis.loggedInCustomers !== undefined
          ? `${realKpis.orderingCustomers ?? 0}/${realKpis.loggedInCustomers ?? 0} logged-in ordered`
          : undefined,
    },
    {
      label: 'Returning customers',
      value: realKpis ? `${realKpis.returningRate}%` : '—',
      delta: realKpis ? realKpis.returningDelta : '',
      isReal: Boolean(realKpis),
      extra:
        realKpis && realKpis.returningCustomers !== undefined
          ? `${realKpis.returningCustomers}/${realKpis.totalCustomers ?? 0} repeat buyers`
          : undefined,
    },
    {
      label: 'Discounts',
      value: realKpis ? formatBDT(realKpis.discounts) : '—',
      delta: realKpis ? realKpis.discountsDelta : '',
      isReal: Boolean(realKpis),
    },
    {
      label: 'Shipping revenue',
      value:
        realKpis?.shippingRevenue !== undefined
          ? formatBDT(realKpis.shippingRevenue)
          : '—',
      delta: realKpis?.shippingDelta || '',
      isReal: Boolean(realKpis),
    },
  ];

  return (
    <ModuleGate module="analytics">
      <div className="w-full space-y-6">
        <PageHeader
          title="Analytics"
          description="All figures in BDT, VAT inclusive."
          actions={
            <>
              <div
                className="flex rounded-md border border-line bg-surface p-0.5 text-xs"
                role="group"
                aria-label="Date range"
              >
                {ranges.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={cn(
                      'whitespace-nowrap rounded px-2.5 py-1 cursor-pointer transition-colors',
                      range === r
                        ? 'bg-ink text-canvas font-medium'
                        : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          }
        />

        <Panel className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-muted">Net sales · {range}</p>
              {isLoadingKpis && !realKpis ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading analytics…</span>
                </div>
              ) : overviewError && !realKpis ? (
                <p className="mt-2 text-sm text-ink-muted">
                  Could not load analytics
                </p>
              ) : realKpis ? (
                <>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
                    {formatBDT(realKpis.netSales)}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {realKpis.salesDelta} vs previous period · Gross{' '}
                    {formatBDT(realKpis.grossSales)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">No analytics data</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="rounded border-line-strong text-ink"
              />{' '}
              Compare to previous period
            </label>
          </div>
          <div className="mt-5 h-64 w-full">
            {isLoadingKpis && seriesData.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading chart…</span>
              </div>
            ) : overviewError && seriesData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                Could not load analytics
              </div>
            ) : seriesData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                No analytics data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={seriesData}
                  margin={{ left: 0, right: 8, top: 8 }}
                >
                  <CartesianGrid stroke="#E9E4DA" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompactBDT(v)}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const raw = Array.isArray(value) ? value[0] : value;
                      return raw != null && raw !== '' ? formatBDT(Number(raw)) : '';
                    }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      backgroundColor: 'var(--color-surface, #fff)',
                      borderColor: 'var(--color-line, #e5e5e5)',
                      color: 'var(--color-ink, #000)',
                    }}
                  />
                  <Area
                    dataKey="sales"
                    name="This period"
                    stroke="#1C1A17"
                    strokeWidth={2}
                    fill="#1C1A17"
                    fillOpacity={0.06}
                  />
                  {compare && (
                    <Line
                      dataKey="prev"
                      name="Previous"
                      stroke="#B5562F"
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {secondary.map((item) => (
            <div key={item.label} className="bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-ink-muted">{item.label}</dt>
                {item.isReal && (
                  <span
                    title="Real database live data"
                    className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    ● Real
                  </span>
                )}
              </div>
              <dd className="mt-1 text-base font-semibold tabular-nums text-ink">
                {isLoadingKpis && !realKpis ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                ) : (
                  <>
                    {item.value}{' '}
                    {item.delta ? (
                      <span className="text-xs font-normal text-ink-muted">
                        {item.delta}
                      </span>
                    ) : null}
                  </>
                )}
              </dd>
              {item.extra && (
                <p className="mt-0.5 text-xs text-ink-muted">{item.extra}</p>
              )}
            </div>
          ))}
        </dl>

        <div className="space-y-6">
          {/* Real Database Connected: Sales by District */}
          <Panel
            title="Sales by district"
            actions={
              isLoadingRegion ? (
                <div className="flex items-center gap-1 text-xs text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : overviewError ? (
                <span className="text-xs text-ink-muted">Unavailable</span>
              ) : (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ● Real-time
                </span>
              )
            }
          >
            <div className="h-56 w-full">
              {isLoadingRegion && regionData.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-xs text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading…</span>
                </div>
              ) : overviewError && regionData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-muted">
                  Could not load analytics
                </div>
              ) : regionData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-muted">
                  No district sales recorded yet for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionData}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#5A544B' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const raw = Array.isArray(value) ? value[0] : value;
                        return raw != null && raw !== '' ? formatBDT(Number(raw)) : '৳0';
                      }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 6,
                        backgroundColor: 'var(--color-surface, #fff)',
                        borderColor: 'var(--color-line, #e5e5e5)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#1C1A17"
                      radius={[0, 3, 3, 0]}
                      barSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>

          {/* Real Database Connected: Top Searches */}
          <Panel
            title="Top searches"
            description="Zero-result searches are flagged so you can add products or synonyms"
            actions={
              <div className="flex items-center gap-2">
                {isLoadingSearches ? (
                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    ● Real-time
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchTopSearches(true)}
                  title="Refresh search queries"
                  className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            }
            flush
          >
            {searchesData.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-ink-muted">
                No customer search queries recorded yet. Type any word in the storefront search bar to test live tracking.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-muted">
                    <th className="px-5 py-2.5 font-medium">Search</th>
                    <th className="px-5 py-2.5 text-right font-medium">Searches</th>
                    <th className="px-5 py-2.5 text-right font-medium">Products Found</th>
                    <th className="px-5 py-2.5 text-right font-medium">Product Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {searchesData.map((s) => (
                    <tr key={s.term} className="hover:bg-subtle/30 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-ink capitalize">
                        {s.term}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-ink font-semibold">
                        {formatNumber(s.count)}
                      </td>
                      <td
                        className={cn(
                          'px-5 py-2.5 text-right tabular-nums font-medium',
                          s.results === 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-ink'
                        )}
                      >
                        {s.results === 0 ? '0 (No results)' : formatNumber(s.results)}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-ink font-semibold">
                        {formatNumber(s.clicks || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </ModuleGate>
  );
}
