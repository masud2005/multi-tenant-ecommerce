import { PrismaClient } from '../generated/client';

export async function seedBrands(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping brand seed.');
    return;
  }

  const brandDefinitions = [
    {
      name: 'Tanti Studio',
      slug: 'tanti-studio',
      description: 'Our in-house label for modern everyday Bangladeshi wear.',
      logo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Tanti Loom',
      slug: 'tanti-loom',
      description: 'Handwoven textiles made with master weavers across Bangladesh.',
      logo: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Tanti Kids',
      slug: 'tanti-kids',
      description: 'Soft, comfortable clothing designed specially for little ones.',
      logo: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Pora',
      slug: 'pora',
      description: 'Handcrafted leather goods and footwear, finished in Bhairab.',
      logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Roopa',
      slug: 'roopa',
      description: 'Handcrafted artisan silver and heritage jewellery by Old Dhaka silversmiths.',
      logo: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80',
    },
  ];

  for (const b of brandDefinitions) {
    const brand = await prisma.brand.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: b.slug,
        },
      },
      update: {
        name: b.name,
        description: b.description,
        logo: b.logo,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo: b.logo,
        isActive: true,
      },
    });

    console.log(`Seeded brand: ${brand.name} (${brand.slug})`);
  }

  console.log('Brands seeded successfully!');
}
