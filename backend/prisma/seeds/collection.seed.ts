import { PrismaClient, CollectionType } from '../generated/client';

export async function seedCollections(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping collection seed.');
    return;
  }

  const collectionDefinitions = [
    {
      name: 'Eid Collection 2026',
      slug: 'eid-2026',
      description: 'Festive pieces in clay, sage and ivory — made for long days with family.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      type: CollectionType.MANUAL,
      isFeatured: true,
      order: 1,
    },
    {
      name: 'Heritage Weaves',
      slug: 'heritage-weaves',
      description: 'Jamdani, Rajshahi silk and handcrafted silver from master artisans.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      type: CollectionType.RULE,
      rule: { condition: 'contains', field: 'tags', value: 'handwoven' },
      isFeatured: true,
      order: 2,
    },
    {
      name: 'Summer Linen',
      slug: 'summer-linen',
      description: 'Breathable linen and cotton voile for the monsoon heat.',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
      type: CollectionType.RULE,
      rule: { condition: 'contains', field: 'tags', value: 'linen' },
      isFeatured: true,
      order: 3,
    },
    {
      name: 'Everyday Cotton',
      slug: 'everyday-cotton',
      description: 'Soft, easy cotton pieces you will reach for every day.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      type: CollectionType.MANUAL,
      isFeatured: false,
      order: 4,
    },
    {
      name: 'City Essentials',
      slug: 'city-essentials',
      description: 'Footwear and bags built for Dhaka streets.',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80',
      type: CollectionType.MANUAL,
      isFeatured: false,
      order: 5,
    },
  ];

  for (const c of collectionDefinitions) {
    const col = await prisma.collection.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: c.slug,
        },
      },
      update: {
        name: c.name,
        description: c.description,
        image: c.image,
        type: c.type,
        rule: c.rule,
        isFeatured: c.isFeatured,
        order: c.order,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        type: c.type,
        rule: c.rule,
        isFeatured: c.isFeatured,
        order: c.order,
        isActive: true,
      },
    });

    console.log(`Seeded collection: ${col.name} (${col.slug})`);
  }

  console.log('Collections seeded successfully!');
}
