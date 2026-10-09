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
        update: {
            contact: {
                email: 'care@tanti.com.bd',
                phone: '09612-826842',
                whatsapp: '+880 1700-000000',
                address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
                workingHours: 'Sat–Thu, 10 AM – 9 PM',
                responseTime: 'Replies within 2 to 4 working hours',
                supportTeam: 'Tanti Care team',
            },
            socials: {
                facebook: 'https://facebook.com/tanti',
                instagram: 'https://instagram.com/tanti',
                twitter: 'https://twitter.com/tanti',
            },
        },
        create: {
            name: 'Tanti Fashion',
            slug: 'tanti',
            tagline: 'Handloom & Contemporary Bangladeshi Fashion',
            currency: 'BDT',
            currencySymbol: '৳',
            currencyPosition: 'prefix',
            status: TenantStatus.ACTIVE,
            plan: TenantPlan.GROWTH,
            contact: {
                email: 'care@tanti.com.bd',
                phone: '09612-826842',
                whatsapp: '+880 1700-000000',
                address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
                workingHours: 'Sat–Thu, 10 AM – 9 PM',
                responseTime: 'Replies within 2 to 4 working hours',
                supportTeam: 'Tanti Care team',
            },
            socials: {
                facebook: 'https://facebook.com/tanti',
                instagram: 'https://instagram.com/tanti',
                twitter: 'https://twitter.com/tanti',
            },
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