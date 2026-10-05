'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';
import { blogPosts } from '@/data/content';
import { useStore } from '@/contexts/StoreContext';
import { ProductCard } from '@/components/store/product';
import { formatDate } from '@/utils/format';

interface JournalPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function JournalPostPage({ params }: JournalPostPageProps) {
  const { slug } = use(params);
  const { products } = useStore();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-medium text-ink">Story not found</p>
        <Link href="/journal" className="mt-4 inline-block text-sm text-clay underline">
          Back to journal
        </Link>
      </div>
    );
  }

  const shopTheStory = products
    .filter(
      (p) =>
        p.status === 'published' &&
        (post.category === 'Craft'
          ? p.tags.includes('handwoven') || p.tags.includes('handmade')
          : p.collections.includes('eid-2026'))
    )
    .slice(0, 3);
  const more = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <article className="pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden /> Journal
        </Link>
        <p className="mt-8 text-sm text-clay">{post.category}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-sm text-ink-muted">
          By {post.author} · {formatDate(post.date)} · {post.readTime} read
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
        <img
          src={post.image}
          alt=""
          className="aspect-[16/9] w-full object-cover sm:rounded-lg"
        />
      </div>
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-12 text-lg leading-relaxed text-ink-soft sm:px-6">
        <p className="font-display text-2xl leading-snug text-ink">{post.excerpt}</p>
        <p>
          In a small tin-roofed workshop in Rupganj, the rhythm of the pit loom sets the pace of
          the day. Abdul Karim has been weaving since he was twelve; his father and grandfather
          wove before him. A single saree, he tells us, can take three weeks — every motif added by
          hand with a bamboo needle, thread by thread.
        </p>
        <p>
          What makes jamdani extraordinary is that the pattern is not printed or embroidered onto
          the fabric: it is woven into it, using a supplementary weft technique recognised by
          UNESCO as part of humanity’s intangible cultural heritage.
        </p>
        <blockquote className="border-l-2 border-clay pl-5 font-display text-2xl text-ink">
          “When someone wears my saree to a wedding, a part of this room goes with them.”
        </blockquote>
        <p>
          Every Tanti Loom piece carries a tag with the weaver’s name and village. We pay above the
          cooperative rate, and a share of every sale funds apprenticeships for young weavers.
        </p>
      </div>
      {shopTheStory.length > 0 && (
        <section className="mx-auto mt-20 max-w-5xl px-4 sm:px-6" aria-labelledby="sts-h">
          <h2 id="sts-h" className="font-display text-2xl">
            Shop the story
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {shopTheStory.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <section className="mx-auto mt-20 max-w-5xl border-t border-line px-4 pt-10 sm:px-6">
        <h2 className="text-sm font-medium">More from the journal</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {more.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="group flex gap-4">
              <img
                src={p.image}
                alt=""
                className="h-24 w-32 shrink-0 rounded object-cover"
              />
              <div>
                <p className="text-xs text-clay">{p.category}</p>
                <p className="mt-1 font-display text-lg leading-snug group-hover:underline">
                  {p.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
