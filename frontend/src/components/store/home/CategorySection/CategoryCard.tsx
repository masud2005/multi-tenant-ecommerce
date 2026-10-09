import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface CategoryCardProps {
  id?: string;
  slug?: string;
  name: string;
  image?: string;
  blurb?: string;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80';

export function CategoryCard({ slug, id, name, image, blurb }: CategoryCardProps) {
  const [imgSrc, setImgSrc] = useState(image || DEFAULT_IMAGE);
  const targetCategory = slug || id || '';
  const href = `/shop?category=${encodeURIComponent(targetCategory)}`;

  useEffect(() => {
    if (image) {
      setImgSrc(image);
    }
  }, [image]);

  return (
    <Link
      href={href}
      className="group w-40 shrink-0 snap-start sm:w-auto block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay rounded-lg"
    >
      <div className="overflow-hidden rounded-md bg-subtle border border-line aspect-[4/5] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={name}
          onError={() => setImgSrc(DEFAULT_IMAGE)}
          className="h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <p className="mt-3 text-sm font-medium text-ink group-hover:text-clay transition-colors line-clamp-1">
        {name}
      </p>
      {blurb && (
        <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{blurb}</p>
      )}
    </Link>
  );
}
