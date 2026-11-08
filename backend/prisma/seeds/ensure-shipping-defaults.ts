import 'dotenv/config';
import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEFAULT_STORE_SHIPPING } from '../../src/common/constants/shipping.constant';

const connectionString = process.env.DATABASE_URL || process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true, settings: true },
  });

  for (const tenant of tenants) {
    const existingSettings = (tenant.settings as Record<string, any>) || {};
    const existingShipping =
      (existingSettings.shipping as Record<string, any>) || {};

    // Treat completely blank/zero shipping as uninitialized defaults (not a custom config)
    const insideMissing = typeof existingShipping.insideDhaka !== 'number';
    const outsideMissing = typeof existingShipping.outsideDhaka !== 'number';
    const looksUninitialized =
      Object.keys(existingShipping).length === 0 ||
      (existingShipping.insideDhaka === 0 &&
        existingShipping.outsideDhaka === 0 &&
        (existingShipping.freeDeliveryThreshold === 0 ||
          existingShipping.freeDeliveryThreshold == null));

    if (!insideMissing && !outsideMissing && !looksUninitialized) {
      console.log(
        `Skip ${tenant.slug}: already has Inside ৳${existingShipping.insideDhaka} / Outside ৳${existingShipping.outsideDhaka}`,
      );
      continue;
    }

    const shipping = {
      ...DEFAULT_STORE_SHIPPING,
      ...(looksUninitialized ? {} : existingShipping),
      insideDhaka:
        insideMissing || looksUninitialized
          ? DEFAULT_STORE_SHIPPING.insideDhaka
          : existingShipping.insideDhaka,
      outsideDhaka:
        outsideMissing || looksUninitialized
          ? DEFAULT_STORE_SHIPPING.outsideDhaka
          : existingShipping.outsideDhaka,
    };

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: {
          ...existingSettings,
          shipping,
        },
      },
    });

    console.log(
      `Updated ${tenant.slug}: Inside Dhaka ৳${shipping.insideDhaka}, Outside Dhaka ৳${shipping.outsideDhaka}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
