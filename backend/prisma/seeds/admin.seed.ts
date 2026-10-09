import {
    PrismaClient,
    UserRole,
    UserStatus,
    TenantStatus,
    TenantPlan,
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
        update: {
            isOwner: true,
            status: 'active',
        },
        create: {
            tenantId: defaultTenant.id,
            userId: admin.id,
            isOwner: true,
            status: 'active',
        },
    });

    // Seed default standard tenant roles
    const defaultRoles = [
        {
            name: 'Store Manager',
            description: 'Runs daily operations incl. orders, catalog, customers, and discounts.',
            isSystem: true,
            permissions: {
                dashboard: ['view'],
                orders: ['view', 'create', 'update', 'delete'],
                returns: ['view', 'create', 'update'],
                payments: ['view'],
                products: ['view', 'create', 'update', 'delete'],
                categories: ['view', 'create', 'update', 'delete'],
                collections: ['view', 'create', 'update', 'delete'],
                brands: ['view', 'create', 'update', 'delete'],
                inventory: ['view', 'create', 'update'],
                customers: ['view', 'create', 'update'],
                reviews: ['view', 'update', 'delete'],
                discounts: ['view', 'create', 'update', 'delete'],
                marketing: ['view', 'create', 'update'],
                shipping: ['view', 'update'],
                theme: ['view', 'update'],
                content: ['view', 'create', 'update', 'delete'],
                media: ['view', 'create', 'update', 'delete'],
                analytics: ['view'],
                reports: ['view'],
                notifications: ['view'],
                audit: ['view'],
            },
        },
        {
            name: 'Fulfillment Staff',
            description: 'Processes, packs, and ships orders; manages inventory stock.',
            isSystem: true,
            permissions: {
                dashboard: ['view'],
                orders: ['view', 'update'],
                returns: ['view', 'update'],
                inventory: ['view', 'update'],
                shipping: ['view', 'update'],
                customers: ['view'],
            },
        },
        {
            name: 'Customer Care',
            description: 'Views orders and customers, handles returns, inquiries, and reviews.',
            isSystem: true,
            permissions: {
                dashboard: ['view'],
                orders: ['view', 'update'],
                returns: ['view', 'update'],
                customers: ['view', 'update'],
                reviews: ['view', 'update', 'delete'],
            },
        },
        {
            name: 'Content Editor',
            description: 'Manages catalog items, pages, blogs, and media assets.',
            isSystem: true,
            permissions: {
                dashboard: ['view'],
                products: ['view', 'create', 'update'],
                categories: ['view', 'create', 'update'],
                collections: ['view', 'create', 'update'],
                brands: ['view', 'create', 'update'],
                theme: ['view', 'update'],
                content: ['view', 'create', 'update', 'delete'],
                media: ['view', 'create', 'update', 'delete'],
            },
        },
    ];

    for (const r of defaultRoles) {
        await prisma.tenantRole.upsert({
            where: {
                tenantId_name: {
                    tenantId: defaultTenant.id,
                    name: r.name,
                },
            },
            update: {
                description: r.description,
                permissions: r.permissions,
            },
            create: {
                tenantId: defaultTenant.id,
                name: r.name,
                description: r.description,
                isSystem: r.isSystem,
                permissions: r.permissions,
            },
        });
    }

    console.log(`Admin linked as OWNER to tenant ${defaultTenant.slug} and default roles seeded`);
}