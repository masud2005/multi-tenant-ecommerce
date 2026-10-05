import 'dotenv/config';
import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedAdmin } from './admin.seed';
import { seedCategories } from './category.seed';
import { seedBrands } from './brand.seed';
import { seedCollections } from './collection.seed';
import { seedProducts } from './product.seed';

const connectionString =
    process.env.DATABASE_URL || process.env['DATABASE_URL'];
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Starting Full Database Seeding ---');

    await seedAdmin(prisma);
    await seedCategories(prisma);
    await seedBrands(prisma);
    await seedCollections(prisma);
    await seedProducts(prisma);

    console.log('--- Database Seeding Completed Successfully! ---');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });