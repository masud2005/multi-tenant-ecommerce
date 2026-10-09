import { PrismaClient } from '../generated/client';

export async function seedCategories(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping category seed.');
    return;
  }

  const categoryDefinitions = [
    {
      key: 'women',
      name: 'Women',
      slug: 'women',
      description: 'Kurtas, sarees & co-ords',
      image: 'https://raw.githubusercontent.com/masud2005/fashion-shop/HEAD/public/5d00eda5-b697-4b50-8e72-8b09f015125b.jpg',
      order: 1,
      subcategories: [
        { name: 'Kurtas', slug: 'kurtas', description: 'Handcrafted cotton and silk kurtas' },
        { name: 'Sarees', slug: 'sarees', description: 'Traditional Jamdani and silk sarees' },
        { name: 'Co-ords', slug: 'co-ords', description: 'Modern matching sets' },
        { name: 'Tunics', slug: 'tunics', description: 'Casual everyday tunics' },
      ],
    },
    {
      key: 'men',
      name: 'Men',
      slug: 'men',
      description: 'Panjabis, shirts & koti',
      image: 'https://raw.githubusercontent.com/masud2005/fashion-shop/HEAD/public/f760a839-4e32-4ee4-a5c4-8b2c0eeb4745.jpg',
      order: 2,
      subcategories: [
        { name: 'Panjabis', slug: 'panjabis', description: 'Festive and casual panjabis' },
        { name: 'Shirts', slug: 'shirts', description: 'Tailored casual and formal shirts' },
        { name: 'Koti', slug: 'koti', description: 'Traditional waistcoats and jackets' },
      ],
    },
    {
      key: 'kids',
      name: 'Kids',
      slug: 'kids',
      description: 'Festive & everyday clothing for little ones',
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
      order: 3,
      subcategories: [
        { name: 'Festive', slug: 'festive', description: 'Special celebration outfits for kids' },
        { name: 'Frocks', slug: 'frocks', description: 'Comfortable & stylish frocks for girls' },
        { name: 'Panjabis', slug: 'panjabis', description: 'Traditional panjabi sets for boys' },
        { name: 'Sets', slug: 'sets', description: 'Everyday play sets and matching outfits' },
      ],
    },
    {
      key: 'footwear',
      name: 'Footwear',
      slug: 'footwear',
      description: 'Sneakers, sandals & loafers',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      order: 4,
      subcategories: [
        { name: 'Sneakers', slug: 'sneakers', description: 'Urban lifestyle sneakers' },
        { name: 'Sandals', slug: 'sandals', description: 'Handmade leather sandals' },
        { name: 'Loafers', slug: 'loafers', description: 'Classic formal and casual loafers' },
      ],
    },
    {
      key: 'accessories',
      name: 'Accessories',
      slug: 'accessories',
      description: 'Bags, jewellery & dupattas',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
      order: 5,
      subcategories: [
        { name: 'Bags', slug: 'bags', description: 'Leather bags and totes' },
        { name: 'Jewellery', slug: 'jewellery', description: 'Silver and artisan jewelry' },
        { name: 'Dupattas', slug: 'dupattas', description: 'Embroidered and silk dupattas' },
      ],
    },
  ];

  for (const cat of categoryDefinitions) {
    // 1. Create or update parent category
    const parentCategory = await prisma.category.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: cat.slug,
        },
      },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        status: 'published',
        isActive: true,
        showInNav: true,
      },
      create: {
        tenantId: tenant.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        order: cat.order,
        status: 'published',
        isActive: true,
        showInNav: true,
      },
    });

    console.log(`Seeded category: ${parentCategory.name} (${parentCategory.slug})`);

    // 2. Create or update subcategories
    for (let i = 0; i < cat.subcategories.length; i++) {
      const sub = cat.subcategories[i];
      const subSlug = `${cat.slug}-${sub.slug}`;

      await prisma.category.upsert({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: subSlug,
          },
        },
        update: {
          name: sub.name,
          description: sub.description,
          parentId: parentCategory.id,
          order: i + 1,
          status: 'published',
          isActive: true,
          showInNav: true,
        },
        create: {
          tenantId: tenant.id,
          name: sub.name,
          slug: subSlug,
          description: sub.description,
          parentId: parentCategory.id,
          order: i + 1,
          status: 'published',
          isActive: true,
          showInNav: true,
        },
      });

      console.log(`  -> Subcategory: ${sub.name} under ${parentCategory.name}`);
    }
  }

  console.log('Categories & Subcategories seeded successfully!');
}
