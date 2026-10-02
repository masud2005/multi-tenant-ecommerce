import {
    PrismaClient,
    UserRole,
    UserStatus,
    TenantStatus,
    TenantPlan,
    TenantMemberRole,
} from '../generated/client';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(prisma: PrismaClient) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const plainPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !plainPassword) {
        throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is not set');
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            role: UserRole.OWNER,
            status: UserStatus.ACTIVE,
        },
    });

    console.log(`Admin user seeded: ${admin.email}`);

    // Seed default tenant: tanti
    const defaultTenant = await prisma.tenant.upsert({
        where: { slug: 'tanti' },
        update: {},
        create: {
            name: 'Tanti Fashion',
            slug: 'tanti',
            currency: 'BDT',
            status: TenantStatus.ACTIVE,
            plan: TenantPlan.GROWTH,
        },
    });

    console.log(`Default tenant seeded: ${defaultTenant.name} (${defaultTenant.slug})`);

    // Assign admin as OWNER of default tenant
    await prisma.tenantMember.upsert({
        where: {
            tenantId_userId: {
                tenantId: defaultTenant.id,
                userId: admin.id,
            },
        },
        update: {},
        create: {
            tenantId: defaultTenant.id,
            userId: admin.id,
            role: TenantMemberRole.OWNER,
        },
    });

    console.log(`Admin linked as OWNER to tenant ${defaultTenant.slug}`);
}