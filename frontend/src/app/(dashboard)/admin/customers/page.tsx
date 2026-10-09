'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
  Download,
  Search,
  Users,
  Mail,
  Phone,
  CreditCard,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag,
  RefreshCw,
  Package,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  Eye,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { DataTable, type Column } from '@/components/dashboard/shared/DataTable';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { customerService, mapBackendCustomerToFrontend } from '@/services/customer-service';
import { orderStatusMeta } from '@/utils/status';
import { formatBDT, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Customer } from '@/types/commerce';

const statusFilters = ['All', 'Active', 'Inactive'] as const;

interface PurchasedItemDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderDate: string;
  productId?: string;
  variantId?: string;
  title: string;
  image?: string;
  color?: string;
  colorHex?: string;
  size?: string;
  sku: string;
  price: number;
  qty: number;
  slug?: string;
}

function CustomersContent() {
  const { can } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All');
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Active Customer detailed data
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'profile'>('products');
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch customers from backend API only
  const fetchCustomers = async (searchQuery = q) => {
    try {
      setLoading(true);
      const res = await customerService.getOwnerCustomers({ search: searchQuery });
      if (res?.data?.customers && Array.isArray(res.data.customers)) {
        setCustomerList(res.data.customers);
      } else {
        setCustomerList([]);
      }
    } catch {
      setCustomerList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const activeId = searchParams.get('c');
  const active =
    customerList.find((c) => c.id === activeId) ||
    (customerDetail ? mapBackendCustomerToFrontend(customerDetail) : null);

  // Fetch full details with order items & variants when a customer is opened
  useEffect(() => {
    if (!activeId) {
      setCustomerDetail(null);
      return;
    }

    let isMounted = true;
    const loadDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await customerService.getOwnerCustomerDetail(activeId);
        if (isMounted && res?.data) {
          setCustomerDetail(res.data);
        }
      } catch {
        if (isMounted) setCustomerDetail(null);
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };

    loadDetail();
    setActiveTab('products');

    return () => {
      isMounted = false;
    };
  }, [activeId]);

  const setCustomerParam = (id?: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (id) {
      p.set('c', id);
    } else {
      p.delete('c');
    }
    router.push(`${pathname}?${p.toString()}`);
  };

  // Filter rows by search and status
  const rows = useMemo(() => {
    return customerList.filter((c) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && c.status === 'active') ||
        (statusFilter === 'Inactive' && c.status === 'inactive');

      const matchesQuery =
        !q ||
        `${c.name} ${c.email} ${c.phone} ${(c.tags || []).join(' ')}`
          .toLowerCase()
          .includes(q.toLowerCase());

      return matchesStatus && matchesQuery;
    });
  }, [customerList, statusFilter, q]);

  // Extract purchased items with full variant info across all orders
  const purchasedItems = useMemo<PurchasedItemDetail[]>(() => {
    const list: PurchasedItemDetail[] = [];

    if (customerDetail?.orders && Array.isArray(customerDetail.orders)) {
      for (const ord of customerDetail.orders) {
        if (Array.isArray(ord.items)) {
          for (const item of ord.items) {
            list.push({
              id: item.id,
              orderId: ord.id,
              orderNumber: ord.number || ord.id.slice(0, 8),
              orderStatus: ord.status?.toLowerCase() || 'pending',
              orderDate: ord.createdAt,
              productId: item.productId,
              variantId: item.variantId,
              title: item.title || item.product?.title || 'Product Item',
              image: item.image || item.product?.images?.[0]?.url || '',
              color: item.color || item.variant?.color || '',
              colorHex: item.variant?.colorHex || '',
              size: item.size || item.variant?.size || '',
              sku: item.sku || item.variant?.sku || '',
              price: Number(item.price) || 0,
              qty: Number(item.qty) || 1,
              slug: item.product?.slug || '',
            });
          }
        }
      }
    }

    return list;
  }, [customerDetail]);

  // Total quantity of items bought across all orders
  const totalUnitsBought = useMemo(() => {
    return purchasedItems.reduce((sum, item) => sum + item.qty, 0);
  }, [purchasedItems]);

  const custOrders = useMemo(() => {
    if (customerDetail?.orders && Array.isArray(customerDetail.orders)) {
      return customerDetail.orders;
    }
    return [];
  }, [customerDetail]);

  const handleToggleStatus = async (customer: Customer) => {
    try {
      setIsUpdatingStatus(true);
      const nextActiveState = customer.status !== 'active';
      await customerService.updateCustomerStatus(customer.id, { isActive: nextActiveState });

      setCustomerList((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, status: nextActiveState ? 'active' : 'inactive' }
            : c,
        ),
      );

      if (customerDetail && customerDetail.id === customer.id) {
        setCustomerDetail((prev: any) => ({
          ...prev,
          isActive: nextActiveState,
        }));
      }

      toast.success(
        nextActiveState
          ? `Customer ${customer.name} reactivated successfully`
          : `Customer ${customer.name} deactivated / banned successfully`,
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update customer status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'n',
      header: 'Customer',
      render: (c) => (
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink shadow-xs">
            {c.name
              .split(' ')
              .map((x) => x[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{c.name}</span>
            <span className="block truncate text-xs text-ink-muted">{c.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => (
        <span className="text-xs text-ink-muted">
          {c.phone ? (
            <span className="flex items-center gap-1 font-mono text-ink-soft">
              <Phone className="h-3 w-3 text-ink-muted" aria-hidden />
              {c.phone}
            </span>
          ) : (
            '—'
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'o',
      header: 'Orders',
      align: 'right',
      render: (c) => (
        <span className="flex items-center justify-end gap-1.5 tabular-nums text-ink">
          <ShoppingBag className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
          <span className="font-medium">{c.orders}</span>
        </span>
      ),
    },
    {
      key: 's',
      header: 'Total Spent',
      align: 'right',
      render: (c) => (
        <span className="tabular-nums font-semibold text-ink">
          {formatBDT(c.spent)}
        </span>
      ),
    },
    {
      key: 'credit',
      header: 'Store Credit',
      align: 'right',
      render: (c) => (
        <span className="tabular-nums text-xs font-medium text-ink-soft">
          {c.storeCredit > 0 ? (
            <span className="text-success font-semibold">{formatBDT(c.storeCredit)}</span>
          ) : (
            '৳0'
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (c) => (
        <span className="text-xs text-ink-muted">
          {formatDate(c.joined)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'st',
      header: 'Status',
      render: (c) => (
        <Badge tone={c.status === 'active' ? 'success' : 'neutral'} dot>
          {c.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (c) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCustomerParam(c.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface hover:bg-subtle px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs hover:border-clay hover:text-clay transition-all cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden />
          <span>Details</span>
        </button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Customers"
        description={
          loading
            ? 'Loading customer records...'
            : `${customerList.length} total customers · ${
                customerList.filter((c) => c.status === 'active').length
              } active accounts`
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchCustomers()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
              Refresh
            </button>
            <GuardedButton
              module="customers"
              action="export"
              variant="secondary"
              size="sm"
              disabled={loading || rows.length === 0}
              onClick={() => toast.success(`Exported ${rows.length} customers list`)}
            >
              <Download className="h-4 w-4" aria-hidden /> Export
            </GuardedButton>
          </div>
        }
      />

      <div className="rounded-lg border border-line bg-surface shadow-xs">
        {/* Search & Status Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, phone or tags…"
              aria-label="Search customers"
              className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none transition-colors"
            />
          </div>

          <div
            className="flex items-center gap-1 rounded-lg bg-subtle p-1"
            role="group"
            aria-label="Filter by account status"
          >
            {statusFilters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                aria-pressed={statusFilter === s}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                  statusFilter === s
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton / Data Table */}
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-ink-muted py-6">
              <Loader2 className="h-5 w-5 animate-spin text-clay" />
              <span>Loading real customer data from store...</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-md bg-subtle/70" />
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(c) => c.id}
            onRowClick={(c) => setCustomerParam(c.id)}
            empty={
              <EmptyState
                icon={Users}
                title="No customers match your criteria"
                description="When customers register or place orders in your store, they will appear here."
              />
            }
          />
        )}
      </div>

      {/* Customer Details Drawer */}
      <Drawer
        open={!!active}
        onClose={() => setCustomerParam(undefined)}
        width="max-w-xl"
        title={active?.name ?? ''}
        subtitle={
          active && (
            <span className="flex items-center gap-2">
              <Badge tone={active.status === 'active' ? 'success' : 'neutral'} dot>
                {active.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-ink-muted">
                Customer since {formatDate(active.joined)}
              </span>
            </span>
          )
        }
        footer={
          active && (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-xs text-ink-muted">
                ID: <span className="font-mono text-[11px]">{active.id.slice(0, 8)}...</span>
              </span>
              <GuardedButton
                module="customers"
                action="update"
                variant={active.status === 'active' ? 'danger' : 'secondary'}
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleToggleStatus(active)}
              >
                {active.status === 'active' ? (
                  <>
                    <XCircle className="h-4 w-4" aria-hidden /> Deactivate Account
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Reactivate Account
                  </>
                )}
              </GuardedButton>
            </div>
          )
        }
      >
        {active && (
          <div className="space-y-5 px-5 py-5 text-sm">
            {/* Quick Metrics Cards */}
            <dl className="grid grid-cols-3 gap-3 rounded-lg bg-canvas p-4 border border-line shadow-xs">
              <div>
                <dt className="text-xs text-ink-muted">Lifetime Spent</dt>
                <dd className="mt-1 text-base font-bold text-ink">
                  {formatBDT(active.spent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Total Orders</dt>
                <dd className="mt-1 text-base font-bold text-ink">
                  {active.orders}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Items Purchased</dt>
                <dd className="mt-1 text-base font-bold text-ink flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-clay" aria-hidden />
                  {totalUnitsBought} <span className="text-xs font-normal text-ink-muted">units</span>
                </dd>
              </div>
            </dl>

            {/* Navigation Tabs for Details */}
            <div className="flex items-center gap-2 border-b border-line pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                  activeTab === 'products'
                    ? 'bg-subtle text-ink border-b-2 border-clay'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas',
                )}
              >
                <Package className="h-3.5 w-3.5" aria-hidden />
                Purchased Products & Variants ({purchasedItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                  activeTab === 'orders'
                    ? 'bg-subtle text-ink border-b-2 border-clay'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas',
                )}
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                Order History ({custOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-subtle text-ink border-b-2 border-clay'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas',
                )}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Profile & Notes
              </button>
            </div>

            {/* Tab 1: Purchased Products with Variants */}
            {activeTab === 'products' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                    All Bought Items & Variants
                  </span>
                  <span className="text-xs font-medium text-ink-muted">
                    Total {totalUnitsBought} units
                  </span>
                </div>

                {loadingDetail ? (
                  <div className="p-8 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-clay" />
                    <span>Loading customer purchased items and variant info...</span>
                  </div>
                ) : purchasedItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                    <Package className="mx-auto h-8 w-8 text-ink-muted mb-2 opacity-50" />
                    No products or items purchased yet by this customer.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {purchasedItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-line bg-surface hover:border-line-strong transition-all shadow-2xs"
                      >
                        {/* Product Thumbnail & Main Details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-subtle text-ink-muted">
                                <Package className="h-6 w-6" aria-hidden />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h5 className="font-semibold text-ink text-sm leading-tight truncate">
                              {item.title}
                            </h5>

                            {/* Variant Attributes: Color, Size, SKU */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              {item.color && (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-subtle px-2 py-0.5 font-medium text-ink-soft border border-line">
                                  {item.colorHex && (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-line"
                                      style={{ backgroundColor: item.colorHex }}
                                    />
                                  )}
                                  Color: {item.color}
                                </span>
                              )}

                              {item.size && (
                                <span className="inline-flex items-center rounded-sm bg-subtle px-2 py-0.5 font-medium text-ink-soft border border-line">
                                  Size: {item.size}
                                </span>
                              )}

                              {item.sku && (
                                <span className="inline-flex items-center rounded-sm font-mono text-[11px] text-ink-muted px-1.5 py-0.5 bg-canvas border border-line">
                                  SKU: {item.sku}
                                </span>
                              )}
                            </div>

                            {/* Order Ref & Date */}
                            <div className="flex items-center gap-2 text-[11px] text-ink-muted pt-0.5">
                              {can('orders') ? (
                                <Link
                                  href={`/admin/orders/${item.orderId}`}
                                  className="text-clay hover:underline font-medium inline-flex items-center gap-0.5"
                                >
                                  Order #{item.orderNumber}
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              ) : (
                                <span>Order #{item.orderNumber}</span>
                              )}
                              <span>•</span>
                              <span>{formatDate(item.orderDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity, Unit Price & Total */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-line shrink-0">
                          <div className="text-right">
                            <span className="font-bold text-ink text-sm">
                              {formatBDT(item.price * item.qty)}
                            </span>
                            <span className="block text-[11px] text-ink-muted">
                              {formatBDT(item.price)} × {item.qty} {item.qty > 1 ? 'units' : 'unit'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Orders History */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden /> All Customer Orders
                  </span>
                  <span className="text-xs font-medium text-ink-muted">
                    {custOrders.length} orders total
                  </span>
                </div>

                {custOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-muted">
                    No orders found for this customer.
                  </div>
                ) : (
                  <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden bg-surface">
                    {custOrders.map((o: any) => {
                      const statusKey = (o.status?.toLowerCase() || 'pending') as keyof typeof orderStatusMeta;
                      const statusConfig = orderStatusMeta[statusKey] || { label: o.status || 'Pending', tone: 'neutral' };

                      return (
                        <li key={o.id}>
                          {can('orders') ? (
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="flex items-center justify-between p-3.5 hover:bg-canvas transition-colors group"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-ink group-hover:text-clay transition-colors flex items-center gap-1.5">
                                  {o.number || `#${o.id.slice(0, 8)}`}
                                  <ChevronRight className="h-3.5 w-3.5 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
                                </span>
                                <span className="text-xs text-ink-muted flex items-center gap-1">
                                  <Calendar className="h-3 w-3" aria-hidden /> {formatDate(o.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge tone={statusConfig.tone as any}>
                                  {statusConfig.label}
                                </Badge>
                                <span className="font-bold text-ink text-sm">
                                  {formatBDT(Number(o.total) || 0)}
                                </span>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center justify-between p-3.5">
                              <span className="font-medium text-ink">{o.number || o.id}</span>
                              <span className="font-bold text-ink">{formatBDT(Number(o.total) || 0)}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Tab 3: Profile & Notes */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Contact & Account Info */}
                <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" aria-hidden /> Contact & Account Details
                  </h4>
                  <div className="space-y-2 text-ink">
                    <p className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                      <span className="font-medium text-ink">{active.email}</span>
                    </p>
                    {active.phone && (
                      <p className="flex items-center gap-2.5 font-mono text-xs">
                        <Phone className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                        <span>{active.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2.5 text-xs text-ink-muted">
                      <CreditCard className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                      Marketing Consent:{' '}
                      <span className={cn('font-medium', active.marketingConsent ? 'text-success' : 'text-ink-muted')}>
                        {active.marketingConsent ? 'Subscribed' : 'Not subscribed'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2.5 text-xs text-ink-muted">
                      <ShoppingBag className="h-4 w-4 text-ink-muted shrink-0" aria-hidden />
                      Store Credit Balance:{' '}
                      <span className="font-semibold text-success font-mono">
                        {formatBDT(active.storeCredit)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Addresses */}
                {customerDetail?.addresses && customerDetail.addresses.length > 0 && (
                  <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> Saved Delivery Addresses
                    </h4>
                    <div className="space-y-2">
                      {customerDetail.addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          className="rounded-md border border-line bg-canvas p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">{addr.label || 'Delivery Address'}</span>
                            {addr.isDefaultShipping && (
                              <span className="rounded-full bg-clay/10 text-clay px-2 py-0.2 text-[10px] font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-ink-soft">{addr.name} • {addr.phone}</p>
                          <p className="text-ink-muted">{addr.line1}, {addr.area}, {addr.district}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Tags */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" aria-hidden /> Tags
                  </p>
                  {(!active.tags || active.tags.length === 0) ? (
                    <p className="mt-2 text-xs text-ink-muted">No tags added yet.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {active.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-subtle px-2.5 py-1 text-xs font-medium text-ink-soft border border-line"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Staff Internal Notes */}
                <Textarea
                  label="Staff Notes"
                  rows={3}
                  placeholder="Add internal notes about this customer (visible only to store admins)..."
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <ModuleGate module="customers">
      <Suspense fallback={<div className="p-8 text-sm text-ink-muted">Loading customers...</div>}>
        <CustomersContent />
      </Suspense>
    </ModuleGate>
  );
}
