'use client';


import { Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge, type Tone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBDT } from '@/utils/format';
import { productPrice, productStock, LOW_STOCK_THRESHOLD } from '@/utils/pricing';
import { categories } from '@/data/products';
import { cn } from '@/lib/utils';
import type { Product, ProductStatus } from '@/types/product';

const statusTone: Record<ProductStatus, Tone> = {
  published: 'success',
  draft: 'neutral',
  archived: 'warning',
};

interface ProductTableProps {
  products: Product[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onRowClick?: (product: Product) => void;
}

export function ProductTable({
  products,
  selectedIds,
  onSelectedChange,
  onRowClick,
}: ProductTableProps) {
  const allIds = products.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = (checked: boolean) => {
    onSelectedChange(checked ? allIds : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectedChange([...selectedIds, id]);
    } else {
      onSelectedChange(selectedIds.filter((item) => item !== id));
    }
  };

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No products match"
        description="Adjust filters or add a new product."
      />
    );
  }

  return (
    <>
      {/* Mobile Card Layout (under md) */}
      <ul className="divide-y divide-line md:hidden">
        {products.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          const stock = productStock(p);

          return (
            <li
              key={p.id}
              onClick={() => onRowClick?.(p)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                onRowClick && 'cursor-pointer active:bg-canvas',
                isSelected && 'bg-clay-soft/40'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80'}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80';
                }}
                className="h-12 w-10 rounded object-cover shrink-0 bg-subtle"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{p.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {stock} in stock · {formatBDT(productPrice(p))}
                </p>
              </div>
              <Badge tone={statusTone[p.status]} dot>
                {p.status[0].toUpperCase() + p.status.slice(1)}
              </Badge>
            </li>
          );
        })}
      </ul>

      {/* Desktop Table (md and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-left text-xs text-ink-muted">
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  ariaLabel="Select all products"
                />
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Inventory</th>
              <th scope="col" className="px-4 py-2.5 font-medium hidden lg:table-cell">Category</th>
              <th scope="col" className="px-4 py-2.5 font-medium text-right">Price</th>
              <th scope="col" className="px-4 py-2.5 font-medium text-right hidden lg:table-cell">Sold · 30d</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const stock = productStock(p);
              const categoryName = categories.find((c) => c.key === p.category)?.name || p.category;

              return (
                <tr
                  key={p.id}
                  onClick={() => onRowClick?.(p)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-canvas/70',
                    isSelected && 'bg-clay-soft/40'
                  )}
                >
                  {/* Row Checkbox */}
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => toggleSelectOne(p.id, checked)}
                      ariaLabel={`Select ${p.title}`}
                    />
                  </td>

                  {/* Product Title & Thumbnail */}
                  <td className="px-4 py-3 align-middle">
                    <span className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80'}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="h-11 w-9 rounded object-cover shrink-0 bg-subtle"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-ink truncate">{p.title}</span>
                        <span className="block text-xs text-ink-muted">
                          {p.variants.length} variants · {p.brand}
                        </span>
                      </span>
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3 align-middle">
                    <Badge tone={statusTone[p.status]} dot>
                      {p.status[0].toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </td>

                  {/* Inventory / Stock */}
                  <td className="px-4 py-3 align-middle">
                    {p.preorder ? (
                      <span className="text-info font-medium">Pre-order</span>
                    ) : (
                      <span
                        className={cn(
                          stock === 0
                            ? 'text-danger font-medium'
                            : stock <= LOW_STOCK_THRESHOLD * 2
                            ? 'text-warning font-medium'
                            : 'text-ink-soft'
                        )}
                      >
                        {stock} in stock
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 align-middle text-ink-muted hidden lg:table-cell">
                    <span>
                      {categoryName} / {p.subcategory}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 align-middle text-right">
                    <span className="tabular-nums font-medium text-ink">
                      {formatBDT(productPrice(p))}
                      {p.salePrice && (
                        <span className="ml-1.5 text-xs text-ink-muted line-through">
                          {formatBDT(p.price)}
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Sold */}
                  <td className="px-4 py-3 align-middle text-right tabular-nums text-ink-muted hidden lg:table-cell">
                    {p.sold}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
