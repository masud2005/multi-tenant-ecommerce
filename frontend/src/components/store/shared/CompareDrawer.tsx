'use client';

import React from 'react';
import Link from 'next/link';
import { ScaleIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/contexts/StoreContext';
import { Modal } from '@/components/ui/Modal';
import { Rating } from '@/components/ui/Rating';
import { productPrice, productStock } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';

export function CompareDrawer() {
  const { compare, products, toggleCompare, compareOpen, setCompareOpen } =
    useStore();
  const items = compare
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean);

  const rows: {
    label: string;
    render: (p: (typeof items)[number]) => React.ReactNode;
  }[] = [
    {
      label: 'Price',
      render: (p) => (
        <span className="font-semibold text-ink">
          {formatBDT(productPrice(p))}
        </span>
      ),
    },
    {
      label: 'Rating',
      render: (p) => (
        <span className="flex items-center gap-1.5 text-ink">
          <Rating value={p.rating} /> {p.rating}
        </span>
      ),
    },
    { label: 'Brand', render: (p) => p.brand },
    { label: 'Category', render: (p) => p.subcategory || p.category },
    {
      label: 'Colours',
      render: (p) => p.colors.map((c) => c.name).join(', '),
    },
    { label: 'Sizes', render: (p) => p.sizes.join(', ') },
    {
      label: 'Material',
      render: (p) =>
        p.specs.find((s) => ['Fabric', 'Upper', 'Material'].includes(s.label))
          ?.value ?? '—',
    },
    {
      label: 'Availability',
      render: (p) =>
        productStock(p) > 0
          ? 'In stock'
          : p.preorder
          ? 'Pre-order'
          : 'Sold out',
    },
  ];

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating pill */}
      <aside
        aria-label="Product comparison floating bar"
        className="fixed bottom-6 right-6 z-30"
      >
        <button
          onClick={() => setCompareOpen(true)}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-canvas shadow-pop hover:bg-clay transition-colors cursor-pointer"
        >
          <ScaleIcon className="h-4 w-4" />
          <span>Compare ({items.length}/4)</span>
        </button>
      </aside>

      {/* Comparison Modal */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compare products"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 pr-4 font-normal text-ink-muted w-32">
                  Product
                </th>
                {items.map((p) => (
                  <th key={p.id} className="p-3 min-w-[180px] align-top">
                    <div className="relative">
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="absolute -top-1 -right-1 rounded-full bg-surface p-1 text-ink-muted hover:text-ink border border-line"
                        aria-label={`Remove ${p.title} from comparison`}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]}
                        alt=""
                        className="aspect-[4/5] w-full rounded object-cover"
                      />
                      <Link
                        href={`/products/${p.slug}`}
                        className="mt-2 block font-medium text-ink hover:text-clay"
                      >
                        {p.title}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-line/60">
                  <td className="py-3 pr-4 font-medium text-ink-muted text-xs uppercase tracking-wider">
                    {r.label}
                  </td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3 text-ink align-top">
                      {r.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
