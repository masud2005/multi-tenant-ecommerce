import { PrismaClient, DiscountType, DiscountMethod, DiscountStatus } from '../generated/client';

export async function seedDiscounts(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping discount seed.');
    return;
  }

  const discounts = [
    {
      code: 'EID500',
      title: 'Eid Mega Offer ৳500 Flat Off',
      type: DiscountType.FIXED_AMOUNT,
      method: DiscountMethod.CODE,
      status: DiscountStatus.ACTIVE,
      value: 500,
      minSubtotal: 3000,
      maxDiscountAmount: 500,
      usageLimit: 1000,
      usageLimitPerUser: 1,
      startsAt: new Date('2026-03-01T00:00:00.000Z'),
      endsAt: new Date('2026-10-31T23:59:59.000Z'),
    },
    {
      code: 'WELCOME10',
      title: 'First Order 10% Discount',
      type: DiscountType.PERCENTAGE,
      method: DiscountMethod.CODE,
      status: DiscountStatus.ACTIVE,
      value: 10,
      minSubtotal: 1000,
      maxDiscountAmount: 300,
      usageLimit: 5000,
      usageLimitPerUser: 1,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
    },
    {
      code: 'FREESHIP',
      title: 'Free Express Shipping Across Bangladesh',
      type: DiscountType.FREE_SHIPPING,
      method: DiscountMethod.CODE,
      status: DiscountStatus.ACTIVE,
      value: 0,
      minSubtotal: 2000,
      usageLimit: 2000,
      usageLimitPerUser: 2,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
    },
  ];

  for (const d of discounts) {
    const created = await prisma.discount.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: d.code,
        },
      },
      update: {
        title: d.title,
        type: d.type,
        method: d.method,
        status: d.status,
        value: d.value,
        minSubtotal: d.minSubtotal,
        maxDiscountAmount: d.maxDiscountAmount,
        usageLimit: d.usageLimit,
        usageLimitPerUser: d.usageLimitPerUser,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
      },
      create: {
        tenantId: tenant.id,
        code: d.code,
        title: d.title,
        type: d.type,
        method: d.method,
        status: d.status,
        value: d.value,
        minSubtotal: d.minSubtotal,
        maxDiscountAmount: d.maxDiscountAmount,
        usageLimit: d.usageLimit,
        usageLimitPerUser: d.usageLimitPerUser,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
      },
    });

    console.log(`Seeded discount: ${created.title} (${created.code})`);
  }

  console.log('Discounts seeded successfully!');
}
