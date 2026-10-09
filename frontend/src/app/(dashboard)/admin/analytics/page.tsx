'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, RotateCw } from 'lucide-react';
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
import {
  salesSeries as mockSalesSeries,
  kpis as mockKpis,
  salesByRegion as mockSalesByRegion,
  salesByChannel as mockSalesByChannel,
} from '@/data/analytics';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
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

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>('30 days');
  const [compare, setCompare] = useState(true);
  const [regionData, setRegionData] = useState<DistrictSalesItem[]>(mockSalesByRegion);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [searchesData, setSearchesData] = useState<SearchQueryItem[]>([]);
  const [isLoadingSearches, setIsLoadingSearches] = useState(false);

  // Fetch real database sales by district whenever date range changes
  useEffect(() => {
    let mounted = true;

    async function loadDistrictSales() {
      try {
        setIsLoadingRegion(true);
        const data = await analyticsService.getSalesByDistrict(range);
        if (mounted && data && data.length > 0) {
          setRegionData(data);
        }
      } catch (err) {
        console.error('Failed to load real district sales:', err);
      } finally {
        if (mounted) {
          setIsLoadingRegion(false);
        }
      }
    }

    loadDistrictSales();

    return () => {
      mounted = false;
    };
  }, [range]);

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

  const secondary = [
    ['Orders', formatNumber(mockKpis.orders), '+18%'],
    ['Avg. order value', formatBDT(mockKpis.aov), '+4%'],
    ['Conversion rate', `${mockKpis.conversionRate}%`, '+0.3 pt'],
    ['Returning customers', `${mockKpis.returningRate}%`, '+2 pt'],
    ['Refunds', formatBDT(mockKpis.refunds), '−6%'],
    ['Discounts', formatBDT(mockKpis.discounts), '+11%'],
    ['Shipping revenue', formatBDT(mockKpis.shippingRevenue), '+9%'],
    ['Cart abandonment', `${mockKpis.cartAbandonment}%`, '−1.4 pt'],
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
              <GuardedButton
                module="analytics"
                action="export"
                variant="secondary"
                size="sm"
                onClick={() => toast.success('analytics-30d.xlsx exported')}
              >
                <Download className="h-4 w-4" aria-hidden /> Export
              </GuardedButton>
            </>
          }
        />

        <Panel className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-muted">Net sales · {range}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
                {formatBDT(mockKpis.netSales)}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                +22.4% vs previous period · Gross {formatBDT(mockKpis.grossSales)}
              </p>
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
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={mockSalesSeries}
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
                  formatter={(value: any) =>
                    value ? formatBDT(Number(value)) : ''
                  }
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
          </div>
        </Panel>

        <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {secondary.map(([l, v, d]) => (
            <div key={l} className="bg-surface px-4 py-3">
              <dt className="text-xs text-ink-muted">{l}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-ink">
                {v}{' '}
                <span className="text-xs font-normal text-ink-muted">{d}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Real Database Connected: Sales by District */}
          <Panel
            title="Sales by district"
            actions={
              isLoadingRegion ? (
                <div className="flex items-center gap-1 text-xs text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ● Real-time
                </span>
              )
            }
          >
            <div className="h-56 w-full">
              {regionData.length === 0 ? (
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
                      formatter={(value: any) =>
                        value ? formatBDT(Number(value)) : '৳0'
                      }
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

          {/* Traffic Source */}
          <Panel title="Traffic source">
            <ul className="space-y-2.5">
              {mockSalesByChannel.map((d) => (
                <li
                  key={d.name}
                  className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-sm"
                >
                  <span className="text-ink">{d.name}</span>
                  <div className="h-2 rounded-full bg-subtle">
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-ink-muted">
                    {d.value}%
                  </span>
                </li>
              ))}
            </ul>
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
            className="lg:col-span-2"
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
