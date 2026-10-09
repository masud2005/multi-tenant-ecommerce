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
    // ==========================================
    // 1. WOMEN (7 Products)
    // ==========================================
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
      tags: ['handwoven', 'jamdani', 'cotton', 'summer', 'festive'],
      collectionSlugs: ['eid-2026', 'heritage-weaves', 'summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
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
      tags: ['linen', 'indigo', 'co-ord', 'summer'],
      collectionSlugs: ['summer-linen', 'everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'S', sku: 'TN-VOI-IND-S', stock: 14, price: 5400 },
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'M', sku: 'TN-VOI-IND-M', stock: 20, price: 5400 },
        { color: 'Indigo Blue', colorHex: '#2C3E50', size: 'L', sku: 'TN-VOI-IND-L', stock: 11, price: 5400 },
        { color: 'Olive Moss', colorHex: '#556B2F', size: 'M', sku: 'TN-VOI-OLV-M', stock: 12, price: 5400 },
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
      tags: ['handwoven', 'muslin', 'zari', 'heritage', 'festive'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Golden Ivory', colorHex: '#FDFBF7', size: 'Free Size', sku: 'TN-MUS-GLD-FS', stock: 5, price: 18500, salePrice: 16500 },
        { color: 'Rose Blush', colorHex: '#E8C5C8', size: 'Free Size', sku: 'TN-MUS-RSE-FS', stock: 4, price: 18500, salePrice: 16500 },
      ],
    },
    {
      title: 'Tangail Weave Handloom Saree',
      slug: 'tangail-weave-handloom-saree',
      categorySlug: 'women',
      subcategorySlug: 'women-sarees',
      brandSlug: 'tanti-loom',
      price: 6800,
      salePrice: 5900,
      cost: 3200,
      shortDescription: 'Pure handloom cotton saree with intricate jacquard border from Tangail.',
      description: 'Traditional Tangail saree celebrated for its ultra-soft texture, delicate weaving technique, and vibrant color-blocked border accents.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.7,
      reviewCount: 35,
      sold: 112,
      tags: ['handwoven', 'tangail', 'cotton', 'saree'],
      collectionSlugs: ['heritage-weaves', 'everyday-cotton'],
      images: [
        { url: 'https://scontent.fdac142-1.fna.fbcdn.net/v/t51.82787-15/670366591_18047480876742972_8870223386990167877_n.jpg?stp=dst-jpg_tt6&cstp=mx768x1024&ctp=s768x1024&_nc_cat=107&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_ohc=OdB9ecEcNjgQ7kNvwEvVEx0&_nc_oc=AdrvgpV-fYJhy53XDMHqDGAct01AZL8-0juxefuh-yHfRIZmPxpwTQPD4IV-Dd6U9gQ&_nc_zt=23&_nc_ht=scontent.fdac142-1.fna&_nc_gid=QHwkBQClH8SgLGOVYHBRiQ&_nc_ss=7b2a8&oh=00_AQOH_DBxY-PCHVIEdH0hU4fUqimhvZlpCUtLZ29omOtjkA&oe=6ACAE1B1', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Crimson Red', colorHex: '#990000', size: 'Free Size', sku: 'TN-TAN-CRM-FS', stock: 12, price: 6800, salePrice: 5900 },
        { color: 'Mustard Gold', colorHex: '#E1AD01', size: 'Free Size', sku: 'TN-TAN-MST-FS', stock: 9, price: 6800, salePrice: 5900 },
      ],
    },
    {
      title: 'Embroidered Linen Tunic Top',
      slug: 'embroidered-linen-tunic-top',
      categorySlug: 'women',
      subcategorySlug: 'women-tunics',
      brandSlug: 'tanti-studio',
      price: 3200,
      salePrice: null,
      cost: 1450,
      shortDescription: 'Relaxed pure linen tunic with floral neckline embroidery.',
      description: 'A breathable wardrobe staple made from premium Belgian flax linen. Styled with a curved hemline and subtle tonal embroidery along the split collar.',
      isNew: false,
      isBestseller: false,
      preorder: false,
      rating: 4.6,
      reviewCount: 18,
      sold: 76,
      tags: ['linen', 'tunic', 'casual', 'summer'],
      collectionSlugs: ['summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Off White', colorHex: '#FAF9F6', size: 'S', sku: 'TN-TUN-WHT-S', stock: 15, price: 3200 },
        { color: 'Off White', colorHex: '#FAF9F6', size: 'M', sku: 'TN-TUN-WHT-M', stock: 22, price: 3200 },
        { color: 'Off White', colorHex: '#FAF9F6', size: 'L', sku: 'TN-TUN-WHT-L', stock: 14, price: 3200 },
        { color: 'Pastel Peach', colorHex: '#FFDAB9', size: 'M', sku: 'TN-TUN-PCH-M', stock: 18, price: 3200 },
      ],
    },
    {
      title: 'Handblock Indigo Cotton Kurta',
      slug: 'handblock-indigo-cotton-kurta',
      categorySlug: 'women',
      subcategorySlug: 'women-kurtas',
      brandSlug: 'tanti-studio',
      price: 2950,
      salePrice: 2650,
      cost: 1300,
      shortDescription: 'Traditional Bagru hand-block printed kurta in 100% cambric cotton.',
      description: 'Crafted using wooden blocks carved by hand. Natural fermentation indigo bath gives it deep, lasting hues that soften beautifully over time.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 29,
      sold: 130,
      tags: ['block print', 'cotton', 'indigo', 'everyday'],
      collectionSlugs: ['everyday-cotton', 'eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Deep Indigo', colorHex: '#1B263B', size: 'S', sku: 'TN-BLK-IND-S', stock: 14, price: 2950, salePrice: 2650 },
        { color: 'Deep Indigo', colorHex: '#1B263B', size: 'M', sku: 'TN-BLK-IND-M', stock: 25, price: 2950, salePrice: 2650 },
        { color: 'Deep Indigo', colorHex: '#1B263B', size: 'L', sku: 'TN-BLK-IND-L', stock: 16, price: 2950, salePrice: 2650 },
        { color: 'Madder Red', colorHex: '#78281F', size: 'M', sku: 'TN-BLK-MDR-M', stock: 12, price: 2950, salePrice: 2650 },
      ],
    },
    {
      title: 'Rajshahi Pure Silk Party Saree',
      slug: 'rajshahi-pure-silk-party-saree',
      categorySlug: 'women',
      subcategorySlug: 'women-sarees',
      brandSlug: 'tanti-loom',
      price: 14500,
      salePrice: 12900,
      cost: 7200,
      shortDescription: 'Lustrous mulberry silk saree from Rajshahi with antique zari border.',
      description: 'Renowned for its lightweight warmth and royal natural sheen. Hand-dyed in rich emerald jewel tones with matching unstitched blouse piece included.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.9,
      reviewCount: 16,
      sold: 48,
      tags: ['silk', 'rajshahi', 'festive', 'handwoven'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://www.shoplibas.com/cdn/shop/files/maroon-embellished-satin-saree-with-unstitched-blouse-piece-45591p.jpg?v=1776228270&width=1800', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Emerald Green', colorHex: '#097969', size: 'Free Size', sku: 'TN-SLK-EMR-FS', stock: 8, price: 14500, salePrice: 12900 },
        { color: 'Midnight Navy', colorHex: '#000080', size: 'Free Size', sku: 'TN-SLK-NAV-FS', stock: 6, price: 14500, salePrice: 12900 },
      ],
    },

    // ==========================================
    // 2. MEN (7 Products)
    // ==========================================
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
      tags: ['linen', 'panjabi', 'festive', 'summer'],
      collectionSlugs: ['eid-2026', 'summer-linen'],
      images: [
        { url: 'https://tapee.in/cdn/shop/files/WeddingWearMen_sOutfitThreadEmbroideredNavyBlueManKotiKurta_3.png?v=1778392736&width=3840', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sage Green', colorHex: '#7C9082', size: '38', sku: 'TN-PAN-SAG-38', stock: 15, price: 4800, salePrice: 4200 },
        { color: 'Sage Green', colorHex: '#7C9082', size: '40', sku: 'TN-PAN-SAG-40', stock: 25, price: 4800, salePrice: 4200 },
        { color: 'Sage Green', colorHex: '#7C9082', size: '42', sku: 'TN-PAN-SAG-42', stock: 18, price: 4800, salePrice: 4200 },
        { color: 'Sand Beige', colorHex: '#D7C4B7', size: '40', sku: 'TN-PAN-SND-40', stock: 20, price: 4800, salePrice: 4200 },
        { color: 'Sand Beige', colorHex: '#D7C4B7', size: '42', sku: 'TN-PAN-SND-42', stock: 14, price: 4800, salePrice: 4200 },
      ],
    },
    {
      title: 'Semi-Formal Jamdani Collar Panjabi',
      slug: 'semi-formal-jamdani-collar-panjabi',
      categorySlug: 'men',
      subcategorySlug: 'men-panjabis',
      brandSlug: 'tanti-loom',
      price: 5600,
      salePrice: 4950,
      cost: 2700,
      shortDescription: 'Pure handspun cotton panjabi featuring handwoven Jamdani collar and placket.',
      description: 'An elegant statement panjabi blending modern slim silhouette with century-old Jamdani needlework along the neckline and cuffs.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 38,
      sold: 165,
      tags: ['handwoven', 'jamdani', 'panjabi', 'festive'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Pearl White', colorHex: '#FFFFFF', size: '40', sku: 'TN-JMD-WHT-40', stock: 16, price: 5600, salePrice: 4950 },
        { color: 'Pearl White', colorHex: '#FFFFFF', size: '42', sku: 'TN-JMD-WHT-42', stock: 22, price: 5600, salePrice: 4950 },
        { color: 'Charcoal Grey', colorHex: '#36454F', size: '40', sku: 'TN-JMD-GRY-40', stock: 14, price: 5600, salePrice: 4950 },
        { color: 'Charcoal Grey', colorHex: '#36454F', size: '42', sku: 'TN-JMD-GRY-42', stock: 12, price: 5600, salePrice: 4950 },
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
      tags: ['cotton', 'shirt', 'casual', 'everyday'],
      collectionSlugs: ['everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sky Blue', colorHex: '#A0C4E2', size: 'M', sku: 'TN-SHT-SKY-M', stock: 16, price: 2600 },
        { color: 'Sky Blue', colorHex: '#A0C4E2', size: 'L', sku: 'TN-SHT-SKY-L', stock: 22, price: 2600 },
        { color: 'White Slub', colorHex: '#FFFFFF', size: 'M', sku: 'TN-SHT-WHT-M', stock: 30, price: 2600 },
        { color: 'White Slub', colorHex: '#FFFFFF', size: 'L', sku: 'TN-SHT-WHT-L', stock: 18, price: 2600 },
      ],
    },
    {
      title: 'Fine Linen Mandarin Collar Shirt',
      slug: 'fine-linen-mandarin-collar-shirt',
      categorySlug: 'men',
      subcategorySlug: 'men-shirts',
      brandSlug: 'tanti-studio',
      price: 3400,
      salePrice: 2950,
      cost: 1550,
      shortDescription: 'Pure linen long-sleeve shirt with band collar and wooden buttons.',
      description: 'Naturally temperature-regulating linen shirt tailored with single-needle stitching and rounded barrel cuffs.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.7,
      reviewCount: 22,
      sold: 84,
      tags: ['linen', 'shirt', 'summer', 'casual'],
      collectionSlugs: ['summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Soft Khaki', colorHex: '#C3B091', size: 'M', sku: 'TN-LSH-KHK-M', stock: 12, price: 3400, salePrice: 2950 },
        { color: 'Soft Khaki', colorHex: '#C3B091', size: 'L', sku: 'TN-LSH-KHK-L', stock: 18, price: 3400, salePrice: 2950 },
        { color: 'Powder Blue', colorHex: '#B0E0E6', size: 'M', sku: 'TN-LSH-BLU-M', stock: 15, price: 3400, salePrice: 2950 },
        { color: 'Classic White', colorHex: '#FFFFFF', size: 'L', sku: 'TN-LSH-WHT-L', stock: 20, price: 3400, salePrice: 2950 },
      ],
    },
    {
      title: 'Traditional Handwoven Silk Koti',
      slug: 'traditional-handwoven-silk-koti',
      categorySlug: 'men',
      subcategorySlug: 'men-koti',
      brandSlug: 'tanti-loom',
      price: 3900,
      salePrice: 3450,
      cost: 1800,
      shortDescription: 'Handwoven raw silk waistcoat with antique brass coin buttons.',
      description: 'Layer over any solid panjabi for an instant regal celebration look. Features satin lining and welt chest pocket.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 34,
      sold: 140,
      tags: ['koti', 'silk', 'festive', 'handwoven'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Royal Maroon', colorHex: '#800000', size: '40', sku: 'TN-KOT-MRN-40', stock: 14, price: 3900, salePrice: 3450 },
        { color: 'Royal Maroon', colorHex: '#800000', size: '42', sku: 'TN-KOT-MRN-42', stock: 19, price: 3900, salePrice: 3450 },
        { color: 'Antique Bronze', colorHex: '#CD7F32', size: '40', sku: 'TN-KOT-BRZ-40', stock: 10, price: 3900, salePrice: 3450 },
      ],
    },
    {
      title: 'Everyday Organic Cotton Panjabi',
      slug: 'everyday-organic-cotton-panjabi',
      categorySlug: 'men',
      subcategorySlug: 'men-panjabis',
      brandSlug: 'tanti-studio',
      price: 3200,
      salePrice: 2750,
      cost: 1350,
      shortDescription: '100% combed organic cotton panjabi with contrast piping.',
      description: 'Designed for daily comfort and Friday prayers. Ultra-soft breathable weave with deep double side pockets.',
      isNew: false,
      isBestseller: true,
      preorder: false,
      rating: 4.7,
      reviewCount: 45,
      sold: 190,
      tags: ['cotton', 'panjabi', 'everyday'],
      collectionSlugs: ['everyday-cotton'],
      images: [
        { url: 'https://d3j1z37yk0dbyk.cloudfront.net/media/images/2026/09/277036__4_5__20260927125034818.jpg', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sky Grey', colorHex: '#808080', size: '38', sku: 'TN-EPN-GRY-38', stock: 12, price: 3200, salePrice: 2750 },
        { color: 'Sky Grey', colorHex: '#808080', size: '40', sku: 'TN-EPN-GRY-40', stock: 24, price: 3200, salePrice: 2750 },
        { color: 'Sky Grey', colorHex: '#808080', size: '42', sku: 'TN-EPN-GRY-42', stock: 16, price: 3200, salePrice: 2750 },
        { color: 'Dusty Rose', colorHex: '#DCAE96', size: '40', sku: 'TN-EPN-RSE-40', stock: 15, price: 3200, salePrice: 2750 },
      ],
    },
    {
      title: 'Embroidered Festive Velvet Koti',
      slug: 'embroidered-festive-velvet-koti',
      categorySlug: 'men',
      subcategorySlug: 'men-koti',
      brandSlug: 'tanti-loom',
      price: 4600,
      salePrice: null,
      cost: 2100,
      shortDescription: 'Micro-velvet formal waistcoat with antique golden thread border.',
      description: 'Luxurious micro-velvet waistcoat with mandarin collar and intricate golden thread embroidery for wedding and Eid celebrations.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.9,
      reviewCount: 15,
      sold: 62,
      tags: ['koti', 'festive', 'velvet'],
      collectionSlugs: ['eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Deep Navy', colorHex: '#000080', size: '40', sku: 'TN-VKOT-NAV-40', stock: 10, price: 4600 },
        { color: 'Deep Navy', colorHex: '#000080', size: '42', sku: 'TN-VKOT-NAV-42', stock: 15, price: 4600 },
        { color: 'Forest Green', colorHex: '#228B22', size: '42', sku: 'TN-VKOT-GRN-42', stock: 8, price: 4600 },
      ],
    },

    // ==========================================
    // 3. KIDS (6 Products)
    // ==========================================
    {
      title: 'Little Tanti Festive Cotton Frock',
      slug: 'little-tanti-festive-cotton-frock',
      categorySlug: 'kids',
      subcategorySlug: 'kids-frocks',
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
      tags: ['kids', 'festive', 'organic', 'frock'],
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
      title: 'Boys Handloom Cotton Panjabi & Pajama Set',
      slug: 'boys-handloom-cotton-panjabi-set',
      categorySlug: 'kids',
      subcategorySlug: 'kids-panjabis',
      brandSlug: 'tanti-kids',
      price: 2450,
      salePrice: 2150,
      cost: 1100,
      shortDescription: 'Pure cotton panjabi with matching elastic pajama for young boys.',
      description: 'Festive panjabi set with gentle thread work around collar and cuff. Comes with breathable pajama pants designed for active play.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 27,
      sold: 98,
      tags: ['kids', 'panjabi', 'festive', 'cotton'],
      collectionSlugs: ['eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Mustard Yellow', colorHex: '#FFDB58', size: '3-4Y', sku: 'TN-KBPN-MST-3Y', stock: 12, price: 2450, salePrice: 2150 },
        { color: 'Mustard Yellow', colorHex: '#FFDB58', size: '5-6Y', sku: 'TN-KBPN-MST-5Y', stock: 18, price: 2450, salePrice: 2150 },
        { color: 'Sea Green', colorHex: '#2E8B57', size: '5-6Y', sku: 'TN-KBPN-SEA-5Y', stock: 14, price: 2450, salePrice: 2150 },
      ],
    },
    {
      title: 'Girls Floral Block Print Kurti & Salwar',
      slug: 'girls-floral-block-print-kurti-salwar',
      categorySlug: 'kids',
      subcategorySlug: 'kids-sets',
      brandSlug: 'tanti-kids',
      price: 2600,
      salePrice: 2250,
      cost: 1150,
      shortDescription: 'Two-piece traditional kurti and tulip salwar in hand-block floral print.',
      description: 'Crafted from pure 60s count cotton. Features soft pom-pom lace detailing along the hem and adjustable waist drawstrings.',
      isNew: false,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 22,
      sold: 85,
      tags: ['kids', 'block print', 'festive'],
      collectionSlugs: ['eid-2026', 'everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Blossom Pink', colorHex: '#FFB6C1', size: '4-5Y', sku: 'TN-GSET-PNK-4Y', stock: 10, price: 2600, salePrice: 2250 },
        { color: 'Blossom Pink', colorHex: '#FFB6C1', size: '6-7Y', sku: 'TN-GSET-PNK-6Y', stock: 14, price: 2600, salePrice: 2250 },
        { color: 'Daisy Sky', colorHex: '#87CEEB', size: '6-7Y', sku: 'TN-GSET-SKY-6Y', stock: 11, price: 2600, salePrice: 2250 },
      ],
    },
    {
      title: 'Toddler Organic Linen Romper',
      slug: 'toddler-organic-linen-romper',
      categorySlug: 'kids',
      subcategorySlug: 'kids-sets',
      brandSlug: 'tanti-kids',
      price: 1850,
      salePrice: null,
      cost: 800,
      shortDescription: 'Hypoallergenic washed linen romper with wooden button snap closure.',
      description: 'Super gentle for summer naps and crawling. Coconut shell buttons and elastic leg openings ensure supreme comfort.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.7,
      reviewCount: 14,
      sold: 52,
      tags: ['kids', 'linen', 'romper', 'organic'],
      collectionSlugs: ['summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Earth Beige', colorHex: '#E1D9D1', size: '1-2Y', sku: 'TN-ROMP-BGE-1Y', stock: 15, price: 1850 },
        { color: 'Earth Beige', colorHex: '#E1D9D1', size: '2-3Y', sku: 'TN-ROMP-BGE-2Y', stock: 18, price: 1850 },
        { color: 'Soft Sage', colorHex: '#9CAF88', size: '2-3Y', sku: 'TN-ROMP-SAG-2Y', stock: 12, price: 1850 },
      ],
    },
    {
      title: 'Junior Classic Festive Koti & Kurta Set',
      slug: 'junior-classic-festive-koti-kurta-set',
      categorySlug: 'kids',
      subcategorySlug: 'kids-festive',
      brandSlug: 'tanti-kids',
      price: 3100,
      salePrice: 2700,
      cost: 1400,
      shortDescription: 'Three-piece set: jacquard waistcoat, cotton kurta, and pajama.',
      description: 'The complete mini festive ensemble for Eid and family weddings. Structured yet comfortable for hours of fun.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 29,
      sold: 104,
      tags: ['kids', 'koti', 'festive', 'eid'],
      collectionSlugs: ['eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Golden Beige', colorHex: '#F5DEB3', size: '4-5Y', sku: 'TN-JKOT-GLD-4Y', stock: 10, price: 3100, salePrice: 2700 },
        { color: 'Golden Beige', colorHex: '#F5DEB3', size: '6-7Y', sku: 'TN-JKOT-GLD-6Y', stock: 14, price: 3100, salePrice: 2700 },
        { color: 'Ruby Red', colorHex: '#9B111E', size: '6-7Y', sku: 'TN-JKOT-RED-6Y', stock: 8, price: 3100, salePrice: 2700 },
      ],
    },
    {
      title: 'Pure Cotton Summer Play Set',
      slug: 'pure-cotton-summer-play-set',
      categorySlug: 'kids',
      subcategorySlug: 'kids-sets',
      brandSlug: 'tanti-kids',
      price: 1650,
      salePrice: null,
      cost: 720,
      shortDescription: 'Soft jersey tee and pull-on shorts set in bright playful hues.',
      description: 'Everyday playwear made with 100% breathable organic cotton jersey. Stretchy rib collar and covered waistband.',
      isNew: false,
      isBestseller: false,
      preorder: false,
      rating: 4.6,
      reviewCount: 16,
      sold: 68,
      tags: ['kids', 'cotton', 'playwear'],
      collectionSlugs: ['everyday-cotton'],
      images: [
        { url: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Lemon Yellow', colorHex: '#FFF44F', size: '2-3Y', sku: 'TN-PLAY-YEL-2Y', stock: 14, price: 1650 },
        { color: 'Lemon Yellow', colorHex: '#FFF44F', size: '4-5Y', sku: 'TN-PLAY-YEL-4Y', stock: 16, price: 1650 },
        { color: 'Ocean Blue', colorHex: '#0077BE', size: '4-5Y', sku: 'TN-PLAY-BLU-4Y', stock: 12, price: 1650 },
      ],
    },

    // ==========================================
    // 4. FOOTWEAR (6 Products)
    // ==========================================
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
        { color: 'Tan Brown', colorHex: '#8B5A2B', size: '40', sku: 'TN-SND-TAN-40', stock: 8, price: 3600, salePrice: 3200 },
        { color: 'Tan Brown', colorHex: '#8B5A2B', size: '41', sku: 'TN-SND-TAN-41', stock: 14, price: 3600, salePrice: 3200 },
        { color: 'Tan Brown', colorHex: '#8B5A2B', size: '42', sku: 'TN-SND-TAN-42', stock: 20, price: 3600, salePrice: 3200 },
        { color: 'Jet Black', colorHex: '#1A1A1A', size: '41', sku: 'TN-SND-BLK-41', stock: 12, price: 3600, salePrice: 3200 },
        { color: 'Jet Black', colorHex: '#1A1A1A', size: '42', sku: 'TN-SND-BLK-42', stock: 15, price: 3600, salePrice: 3200 },
      ],
    },
    {
      title: 'Urban Lifestyle Canvas Sneaker',
      slug: 'urban-lifestyle-canvas-sneaker',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-sneakers',
      brandSlug: 'pora',
      price: 4200,
      salePrice: null,
      cost: 1950,
      shortDescription: 'Heavy-duty 14oz organic cotton canvas sneaker with vulcanized gum sole.',
      description: 'Timeless retro silhouette featuring reinforced toe-caps, cushioned memory foam insole, and contrast cotton laces.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.7,
      reviewCount: 38,
      sold: 145,
      tags: ['sneakers', 'canvas', 'footwear', 'city'],
      collectionSlugs: ['city-essentials'],
      images: [
        { url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Off White', colorHex: '#F8F8FF', size: '40', sku: 'TN-SNK-WHT-40', stock: 10, price: 4200 },
        { color: 'Off White', colorHex: '#F8F8FF', size: '41', sku: 'TN-SNK-WHT-41', stock: 16, price: 4200 },
        { color: 'Off White', colorHex: '#F8F8FF', size: '42', sku: 'TN-SNK-WHT-42', stock: 22, price: 4200 },
        { color: 'Olive Green', colorHex: '#556B2F', size: '42', sku: 'TN-SNK-OLV-42', stock: 14, price: 4200 },
      ],
    },
    {
      title: 'Handmade Classic Penny Loafer',
      slug: 'handmade-classic-penny-loafer',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-loafers',
      brandSlug: 'pora',
      price: 5800,
      salePrice: 5200,
      cost: 2800,
      shortDescription: 'Full-grain calfskin leather penny loafers with hand-stitched apron.',
      description: 'Blake-stitched construction with genuine leather lining and stacked wooden heel. Pairs seamlessly with formal trousers and festive panjabis.',
      isNew: false,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 52,
      sold: 190,
      tags: ['leather', 'loafer', 'formal', 'handmade'],
      collectionSlugs: ['city-essentials', 'eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Chestnut Brown', colorHex: '#66382A', size: '40', sku: 'TN-LOF-BRN-40', stock: 8, price: 5800, salePrice: 5200 },
        { color: 'Chestnut Brown', colorHex: '#66382A', size: '41', sku: 'TN-LOF-BRN-41', stock: 15, price: 5800, salePrice: 5200 },
        { color: 'Chestnut Brown', colorHex: '#66382A', size: '42', sku: 'TN-LOF-BRN-42', stock: 18, price: 5800, salePrice: 5200 },
        { color: 'Dark Chocolate', colorHex: '#3D1C02', size: '42', sku: 'TN-LOF-DKB-42', stock: 12, price: 5800, salePrice: 5200 },
      ],
    },
    {
      title: 'Heritage Kolhapuri Leather Slide',
      slug: 'heritage-kolhapuri-leather-slide',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-sandals',
      brandSlug: 'pora',
      price: 2900,
      salePrice: null,
      cost: 1300,
      shortDescription: 'Hand-braided vegetable-tanned leather slide with traditional toe ring.',
      description: 'Authentic artisan craftsmanship from Bhairab tanners. Oiled buffed leather that molds naturally to the contours of your feet.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.6,
      reviewCount: 23,
      sold: 88,
      tags: ['leather', 'sandal', 'kolhapuri', 'handmade'],
      collectionSlugs: ['heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Antique Tan', colorHex: '#A0522D', size: '40', sku: 'TN-KOL-TAN-40', stock: 10, price: 2900 },
        { color: 'Antique Tan', colorHex: '#A0522D', size: '41', sku: 'TN-KOL-TAN-41', stock: 16, price: 2900 },
        { color: 'Antique Tan', colorHex: '#A0522D', size: '42', sku: 'TN-KOL-TAN-42', stock: 14, price: 2900 },
        { color: 'Rustic Ochre', colorHex: '#CC7722', size: '41', sku: 'TN-KOL-OCH-41', stock: 8, price: 2900 },
      ],
    },
    {
      title: 'Minimalist Low-Top Leather Sneaker',
      slug: 'minimalist-low-top-leather-sneaker',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-sneakers',
      brandSlug: 'pora',
      price: 4950,
      salePrice: 4400,
      cost: 2300,
      shortDescription: 'Nappa leather sneaker with Italian Margom-style rubber cupsole.',
      description: 'Sleek, uncluttered everyday luxury. Crafted with supple full-grain Nappa leather upper, breathable perforated tongue and waxed laces.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 39,
      sold: 156,
      tags: ['sneakers', 'leather', 'luxury', 'city'],
      collectionSlugs: ['city-essentials'],
      images: [
        { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Chalk White', colorHex: '#FFFFFF', size: '40', sku: 'TN-LSNK-WHT-40', stock: 12, price: 4950, salePrice: 4400 },
        { color: 'Chalk White', colorHex: '#FFFFFF', size: '41', sku: 'TN-LSNK-WHT-41', stock: 18, price: 4950, salePrice: 4400 },
        { color: 'Chalk White', colorHex: '#FFFFFF', size: '42', sku: 'TN-LSNK-WHT-42', stock: 24, price: 4950, salePrice: 4400 },
        { color: 'Slate Grey', colorHex: '#708090', size: '42', sku: 'TN-LSNK-GRY-42', stock: 10, price: 4950, salePrice: 4400 },
      ],
    },
    {
      title: 'Slip-on Suede Leather Driving Loafers',
      slug: 'slip-on-suede-leather-driving-loafers',
      categorySlug: 'footwear',
      subcategorySlug: 'footwear-loafers',
      brandSlug: 'pora',
      price: 4600,
      salePrice: null,
      cost: 2150,
      shortDescription: 'Ultra-flexible split suede driving moccasin with rubber pebble sole.',
      description: 'Unlined buttery suede upper provides immediate glove-like fit. Ideal for casual weekends, travel, and relaxed gatherings.',
      isNew: false,
      isBestseller: false,
      preorder: false,
      rating: 4.7,
      reviewCount: 18,
      sold: 72,
      tags: ['loafer', 'suede', 'casual'],
      collectionSlugs: ['city-essentials'],
      images: [
        { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Navy Suede', colorHex: '#1B263B', size: '41', sku: 'TN-DRV-NAV-41', stock: 12, price: 4600 },
        { color: 'Navy Suede', colorHex: '#1B263B', size: '42', sku: 'TN-DRV-NAV-42', stock: 16, price: 4600 },
        { color: 'Sand Suede', colorHex: '#C2B280', size: '41', sku: 'TN-DRV-SND-41', stock: 10, price: 4600 },
        { color: 'Sand Suede', colorHex: '#C2B280', size: '42', sku: 'TN-DRV-SND-42', stock: 14, price: 4600 },
      ],
    },

    // ==========================================
    // 5. ACCESSORIES (6 Products)
    // ==========================================
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
      description: 'Eco-conscious heavy gauge golden jute body reinforced with genuine leather handles, brass hardware, and interior zipper pocket.',
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
    {
      title: 'Old Dhaka Filigree Silver Necklace',
      slug: 'old-dhaka-filigree-silver-necklace',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-jewellery',
      brandSlug: 'roopa',
      price: 6500,
      salePrice: 5800,
      cost: 3200,
      shortDescription: '92.5 sterling silver filigree choker handcrafted by Tanti Bazar silversmiths.',
      description: 'Delicate spun silver wire handcrafted into floral motifs using centuries-old Dhakai filigree heritage. Includes adjustable silver chain.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 5.0,
      reviewCount: 46,
      sold: 120,
      tags: ['silver', 'jewellery', 'filigree', 'handcrafted', 'festive'],
      collectionSlugs: ['heritage-weaves', 'eid-2026'],
      images: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Sterling Silver', colorHex: '#C0C0C0', size: 'Standard', sku: 'TN-JWL-FLG-ST', stock: 15, price: 6500, salePrice: 5800 },
      ],
    },
    {
      title: 'Handwoven Zari Border Silk Dupatta',
      slug: 'handwoven-zari-border-silk-dupatta',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-dupattas',
      brandSlug: 'tanti-loom',
      price: 3400,
      salePrice: 2950,
      cost: 1500,
      shortDescription: 'Chanderi silk dupatta with woven golden zari booti and scalloped border.',
      description: 'Lightweight, glossy silk dupatta that effortlessly elevates any solid kurta or festive outfit. Length: 2.5 meters.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.8,
      reviewCount: 21,
      sold: 82,
      tags: ['dupatta', 'silk', 'zari', 'festive', 'handwoven'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Crimson Zari', colorHex: '#990000', size: 'Free Size', sku: 'TN-DUP-CRM-FS', stock: 14, price: 3400, salePrice: 2950 },
        { color: 'Emerald Zari', colorHex: '#097969', size: 'Free Size', sku: 'TN-DUP-EMR-FS', stock: 18, price: 3400, salePrice: 2950 },
        { color: 'Royal Ochre', colorHex: '#CC7722', size: 'Free Size', sku: 'TN-DUP-OCH-FS', stock: 10, price: 3400, salePrice: 2950 },
      ],
    },
    {
      title: 'Minimalist Full-Grain Leather Bi-Fold Wallet',
      slug: 'minimalist-full-grain-leather-bi-fold-wallet',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-bags',
      brandSlug: 'pora',
      price: 1950,
      salePrice: 1650,
      cost: 850,
      shortDescription: 'Slim RFID-protected vegetable-tanned cowhide wallet with 6 card slots.',
      description: 'Burnished by hand with natural beeswax. Features dual bill compartments, quick-access card slots, and embossed Pora signature stamp.',
      isNew: false,
      isBestseller: true,
      preorder: false,
      rating: 4.8,
      reviewCount: 64,
      sold: 310,
      tags: ['leather', 'wallet', 'accessories', 'everyday'],
      collectionSlugs: ['city-essentials'],
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Cognac Brown', colorHex: '#9E472A', size: 'Standard', sku: 'TN-WLT-CGN-ST', stock: 35, price: 1950, salePrice: 1650 },
        { color: 'Classic Black', colorHex: '#000000', size: 'Standard', sku: 'TN-WLT-BLK-ST', stock: 40, price: 1950, salePrice: 1650 },
      ],
    },
    {
      title: 'Handcrafted Artisan Silver Jhumka Earrings',
      slug: 'handcrafted-artisan-silver-jhumka-earrings',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-jewellery',
      brandSlug: 'roopa',
      price: 3800,
      salePrice: 3350,
      cost: 1750,
      shortDescription: 'Antique oxidized 92.5 silver jhumkas with delicate hanging pearl drops.',
      description: 'Traditional bell-shaped jhumkas adorned with floral engraving and ghungroo bells. Perfect companion for sarees and kurtas.',
      isNew: true,
      isBestseller: true,
      preorder: false,
      rating: 4.9,
      reviewCount: 37,
      sold: 148,
      tags: ['silver', 'earrings', 'jhumka', 'jewellery', 'festive'],
      collectionSlugs: ['eid-2026', 'heritage-weaves'],
      images: [
        { url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Antique Oxidized Silver', colorHex: '#A8A8A8', size: 'Standard', sku: 'TN-JWL-JHM-ST', stock: 20, price: 3800, salePrice: 3350 },
        { color: 'Gold Dip', colorHex: '#FFD700', size: 'Standard', sku: 'TN-JWL-GLD-ST', stock: 12, price: 3800, salePrice: 3350 },
      ],
    },
    {
      title: 'Handloom Jamdani Cotton Stole / Scarf',
      slug: 'handloom-jamdani-cotton-stole-scarf',
      categorySlug: 'accessories',
      subcategorySlug: 'accessories-dupattas',
      brandSlug: 'tanti-loom',
      price: 2200,
      salePrice: 1850,
      cost: 950,
      shortDescription: '100% fine cotton stole with woven geometric Jamdani buta and fringe edges.',
      description: 'Ultra-lightweight artisanal cotton stole that can be draped as a scarf or dupatta. Hand-spun yarn ensures softness and breathability.',
      isNew: true,
      isBestseller: false,
      preorder: false,
      rating: 4.7,
      reviewCount: 19,
      sold: 92,
      tags: ['jamdani', 'stole', 'cotton', 'handwoven'],
      collectionSlugs: ['heritage-weaves', 'summer-linen'],
      images: [
        { url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1000&q=80', isCover: true, order: 1 },
      ],
      variants: [
        { color: 'Charcoal Floral', colorHex: '#36454F', size: 'Free Size', sku: 'TN-STL-CHR-FS', stock: 18, price: 2200, salePrice: 1850 },
        { color: 'Indigo Floral', colorHex: '#2C3E50', size: 'Free Size', sku: 'TN-STL-IND-FS', stock: 22, price: 2200, salePrice: 1850 },
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

  console.log(`Successfully seeded ${productDefinitions.length} products!`);
}
