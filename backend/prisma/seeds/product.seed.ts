import { PrismaClient, ProductStatus } from '../generated/client';

interface VariantSeed {
  color: string;
  colorHex?: string;
  size: string;
  sku: string;
  stock: number;
  price: number;
  salePrice?: number | null;
}

interface ImageSeed {
  url: string;
  isCover: boolean;
  order: number;
}

interface ProductSeed {
  title: string;
  slug: string;
  categorySlug: string;
  subcategorySlug?: string;
  brandSlug: string;
  price: number;
  salePrice?: number | null;
  cost: number;
  shortDescription: string;
  description: string;
  isNew: boolean;
  isBestseller: boolean;
  preorder: boolean;
  rating: number;
  reviewCount: number;
  sold: number;
  tags: string[];
  collectionSlugs: string[];
  images: ImageSeed[];
  variants: VariantSeed[];
}

export async function seedProducts(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping product seed.');
    return;
  }

  // Fetch created categories, brands, collections for foreign key resolution
  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
  });
  const brands = await prisma.brand.findMany({
    where: { tenantId: tenant.id },
  });
  const collections = await prisma.collection.findMany({
    where: { tenantId: tenant.id },
  });

  const getCat = (slug: string) => categories.find((c) => c.slug === slug);
  const getBrand = (slug: string) => brands.find((b) => b.slug === slug);
  const getCol = (slug: string) => collections.find((c) => c.slug === slug);

  const productDefinitions: ProductSeed[] = [
    {
      title: 'Handloom Jamdani Cotton Kurta',
      slug: 'handloom-jamdani-cotton-kurta',
      categorySlug: 'women',
      subcategorySlug: 'women-kurtas',
      brandSlug: 'tanti-loom',
      price: 4200,
      salePrice: 3800,
      cost: 2100,
      shortDescription: 'Woven with 100-count fine cotton by master artisans in Sonargaon.',
      description: 'A classic breathable Jamdani kurta woven with geometric floral motifs using traditional wooden looms. Features mother-of-pearl buttons and relaxed side slits for effortless movement.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 38,
      sold: 142,
      tags: ['handwoven', 'jamdani', 'cotton', 'summer'],
      collectionSlugs: ['eid-2026', 'heritage-weaves', 'summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', isCover: false, order: 2 },
      ],
      variants: [
        { color: 'Natural Ivory', colorHex: '#F7F4EC', size: 'S', sku: 'TN-JAM-IVO-S', stock: 12, price: 4200, salePrice: 3800 },
        { color: 'Natural Ivory', colorHex: '#F7F4EC', size: 'M', sku: 'TN-JAM-IVO-M', stock: 18, price: 4200, salePrice: 3800 },
        { color: 'Natural Ivory', colorHex: '#F7F4EC', size: 'L', sku: 'TN-JAM-IVO-L', stock: 8, price: 4200, salePrice: 3800 },
        { color: 'Terracotta Clay', colorHex: '#C86D51', size: 'M', sku: 'TN-JAM-CLA-M', stock: 15, price: 4200, salePrice: 3800 },
        { color: 'Terracotta Clay', colorHex: '#C86D51', size: 'L', sku: 'TN-JAM-CLA-L', stock: 10, price: 4200, salePrice: 3800 },
      ],
    },
    {
      title: 'Monsoon Voile Co-ord Set',
      slug: 'monsoon-voile-co-ord-set',
      categorySlug: 'women',
      subcategorySlug: 'women-co-ords',
      brandSlug: 'tanti-studio',
      price: 5400,
      salePrice: null,
      cost: 2600,
      shortDescription: 'Airy pure cotton voile top and culotte trousers in natural indigo.',
      description: 'Designed for humid monsoon days in Dhaka. Light-as-air voile dyed with natural organic indigo pigments, styled with wide-leg cropped trousers and elastic waistband.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.9,
      reviewCount: 24,
      sold: 89,
      tags: ['linen', 'indigo', 'co-ord'],
      collectionSlugs: ['summer-linen', 'everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'S', sku: 'TN-VOI-IND-S', stock: 14, price: 5400 },
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'M', sku: 'TN-VOI-IND-M', stock: 20, price: 5400 },
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'L', sku: 'TN-VOI-IND-L', stock: 11, price: 5400 },
      ],
    },
    {
      title: 'Dhakai Muslin Heritage Saree',
      slug: 'dhakai-muslin-heritage-saree',
      categorySlug: 'women',
      subcategorySlug: 'women-sarees',
      brandSlug: 'tanti-loom',
      price: 18500,
      salePrice: 16500,
      cost: 9000,
      shortDescription: 'Exquisite 300-count spun muslin saree with silver zari aanchal.',
      description: 'A collector heirloom piece reviving authentic 300-count Bengal Muslin. Requires 45 days of delicate hand-weaving by master weavers.',
      isNew: false,
      isBestseller: true,
      preorder: true,
      rating: 5.0,
      reviewCount: 42,
      sold: 53,
      tags: ['handwoven', 'muslin', 'zari', 'heritage'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1610030469668-9359e13d9646?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Golden Ivory', colorHex: '#FDFBF7', size: 'Free Size', sku: 'TN-MUS-GLD-FS', stock: 5, price: 18500, salePrice: 16500 },
      ],
    },
    {
      title: 'Heritage Linen Tailored Panjabi',
      slug: 'heritage-linen-tailored-panjabi',
      categorySlug: 'men',
      subcategorySlug: 'men-panjabis',
      brandSlug: 'tanti-studio',
      price: 4800,
      salePrice: 4200,
      cost: 2200,
      shortDescription: 'Premium European linen panjabi with subtle tonal thread embroidery.',
      description: 'Structured fit crafted from 100% breathable pure linen. Minimalist mandarin collar with handcrafted thread buttons.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.7,
      reviewCount: 56,
      sold: 210,
      tags: ['linen', 'panjabi', 'festive'],
      collectionSlugs: ['eid-2026', 'summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sage Green', colorHex: '#7C9082', size: '38', sku: 'TN-PAN-SAG-38', stock: 15, price: 4800, salePrice: 4200 },
        { color: 'Sage Green', colorHex: '#7C9082', size: '40', sku: 'TN-PAN-SAG-40', stock: 25, price: 4800, salePrice: 4200 },
        { color: 'Sage Green', colorHex: '#7C9082', size: '42', sku: 'TN-PAN-SAG-42', stock: 18, price: 4800, salePrice: 4200 },
        { color: 'Sand Beige', colorHex: '#D7C4B7', size: '40', sku: 'TN-PAN-SND-40', stock: 20, price: 4800, salePrice: 4200 },
      ],
    },
    {
      title: 'Bespoke Cotton Casual Shirt',
      slug: 'bespoke-cotton-casual-shirt',
      categorySlug: 'men',
      subcategorySlug: 'men-shirts',
      brandSlug: 'tanti-studio',
      price: 2600,
      salePrice: null,
      cost: 1100,
      shortDescription: 'Garment-washed slub cotton button-down for everyday comfort.',
      description: 'Soft textured slub cotton shirt with relaxed camp collar. Pre-washed for a comfortable lived-in feel from day one.',
      isNew: false,
      isBestseller: false,
      preorder: false,
      rating: 4.6,
      reviewCount: 19,
      sold: 95,
      tags: ['cotton', 'shirt', 'casual'],
      collectionSlugs: ['everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sky Blue', colorHex: '#A0C4E2', size: 'M', sku: 'TN-SHT-SKY-M', stock: 16, price: 2600 },
        { color: 'Sky Blue', colorHex: '#A0C4E2', size: 'L', sku: 'TN-SHT-SKY-L', stock: 22, price: 2600 },
        { color: 'White Slub', colorHex: '#FFFFFF', size: 'M', sku: 'TN-SHT-WHT-M', stock: 30, price: 2600 },
      ],
    },
    {
      title: 'Little Tanti Festive Cotton Frock',
      slug: 'little-tanti-festive-cotton-frock',
      categorySlug: 'kids',
      subcategorySlug: 'kids-festive',
      brandSlug: 'tanti-kids',
      price: 2200,
      salePrice: 1950,
      cost: 950,
      shortDescription: 'Gentle organic cotton frock with block print and soft inner lining.',
      description: 'Made with baby-soft organic cotton, non-toxic vegetable dyes and smooth internal seams to protect sensitive skin.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 31,
      sold: 115,
      tags: ['kids', 'festive', 'organic'],
      collectionSlugs: ['eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Peach Coral', colorHex: '#F38181', size: '2-3Y', sku: 'TN-KID-PCH-2Y', stock: 10, price: 2200, salePrice: 1950 },
        { color: 'Peach Coral', colorHex: '#F38181', size: '4-5Y', sku: 'TN-KID-PCH-4Y', stock: 15, price: 2200, salePrice: 1950 },
        { color: 'Mint Yellow', colorHex: '#FCE38A', size: '4-5Y', sku: 'TN-KID-MNT-4Y', stock: 12, price: 2200, salePrice: 1950 },
      ],
    },
    {
      title: 'Artisan Full-Grain Leather Sandal',
      slug: 'artisan-full-grain-leather-sandal',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-sandals',
      brandSlug: 'pora',
      price: 3600,
      salePrice: 3200,
      cost: 1600,
      shortDescription: 'Vegetable-tanned cowhide sandals with padded ergonomic footbed.',
      description: 'Hand-cut full-grain leather straps attached to lightweight, durable crepe rubber soles for long walks around the city.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.8,
      reviewCount: 45,
      sold: 160,
      tags: ['leather', 'footwear', 'handmade'],
      collectionSlugs: ['city-essentials'],
      images: [
        { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Tan Brown', colorHex: '#8B5A2B', size: '41', sku: 'TN-SND-TAN-41', stock: 10, price: 3600, salePrice: 3200 },
        { color: 'Tan Brown', colorHex: '#8B5A2B', size: '42', sku: 'TN-SND-TAN-42', stock: 14, price: 3600, salePrice: 3200 },
        { color: 'Jet Black', colorHex: '#1A1A1A', size: '42', sku: 'TN-SND-BLK-42', stock: 12, price: 3600, salePrice: 3200 },
      ],
    },
    {
      title: 'Handcrafted Heritage Jute & Leather Tote',
      slug: 'handcrafted-heritage-jute-leather-tote',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-bags',
      brandSlug: 'pora',
      price: 2900,
      salePrice: null,
      cost: 1250,
      shortDescription: 'Golden fiber jute tote bag trimmed with full-grain leather straps.',
      description: 'Eco-conscious heavy gauge golden jute body reinforced with genuine leather handles and brass hardware.',
      isNew: false,
      isBestseller: true,
      preorder: false,
      rating: 4.7,
      reviewCount: 28,
      sold: 175,
      tags: ['jute', 'bag', 'leather', 'eco'],
      collectionSlugs: ['city-essentials', 'everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Natural Golden', colorHex: '#D4AF37', size: 'Standard', sku: 'TN-BAG-JUT-ST', stock: 25, price: 2900 },
      ],
    },
  ];

  for (const p of productDefinitions) {
    const parentCat = getCat(p.categorySlug);
    if (!parentCat) {
      console.log(`Category ${p.categorySlug} not found for product ${p.title}`);
      continue;
    }

    const subCat = p.subcategorySlug ? getCat(p.subcategorySlug) : null;
    const brand = p.brandSlug ? getBrand(p.brandSlug) : null;

    // Create or update product
    const product = await prisma.product.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: p.slug,
        },
      },
      update: {
        title: p.title,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice ?? null,
        cost: p.cost,
        status: ProductStatus.PUBLISHED,
        isNew: p.isNew,
        isBestseller: p.isBestseller,
        preorder: p.preorder,
        rating: p.rating,
        reviewCount: p.reviewCount,
        sold: p.sold,
        tags: p.tags,
        categoryId: parentCat.id,
        subcategoryId: subCat?.id || null,
        brandId: brand?.id || null,
      },
      create: {
        tenantId: tenant.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        salePrice: p.salePrice ?? null,
        cost: p.cost,
        status: ProductStatus.PUBLISHED,
        isNew: p.isNew,
        isBestseller: p.isBestseller,
        preorder: p.preorder,
        rating: p.rating,
        reviewCount: p.reviewCount,
        sold: p.sold,
        tags: p.tags,
        categoryId: parentCat.id,
        subcategoryId: subCat?.id || null,
        brandId: brand?.id || null,
      },
    });

    // Seed product images
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });
    for (const img of p.images) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          isCover: img.isCover,
          order: img.order,
        },
      });
    }

    // Seed product variants
    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_color_size: {
            productId: product.id,
            color: v.color,
            size: v.size,
          },
        },
        update: {
          sku: v.sku,
          colorHex: v.colorHex,
          price: v.price,
          salePrice: v.salePrice ?? null,
          stock: v.stock,
          enabled: true,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          color: v.color,
          colorHex: v.colorHex,
          size: v.size,
          price: v.price,
          salePrice: v.salePrice ?? null,
          stock: v.stock,
          enabled: true,
        },
      });
    }

    // Connect to collections
    for (const colSlug of p.collectionSlugs) {
      const col = getCol(colSlug);
      if (col) {
        await prisma.productCollection.upsert({
          where: {
            productId_collectionId: {
              productId: product.id,
              collectionId: col.id,
            },
          },
          update: {},
          create: {
            productId: product.id,
            collectionId: col.id,
          },
        });
      }
    }

    console.log(`Seeded product: ${product.title} (${product.slug})`);
  }

  console.log('Products seeded successfully!');
}
