import { PrismaClient } from '../generated/client';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '../../src/modules/notification/notification-template.defaults';

export async function seedNotificationTemplates(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping notification template seed.');
    return;
  }

  // Remove legacy rows that have no canonical key mapping (pre-migration junk)
  await prisma.notificationTemplate.deleteMany({
    where: {
      tenantId: tenant.id,
      key: { notIn: DEFAULT_NOTIFICATION_TEMPLATES.map((t) => t.key) },
    },
  });

  for (const def of DEFAULT_NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: {
        tenantId_key: { tenantId: tenant.id, key: def.key },
      },
      create: {
        tenantId: tenant.id,
        key: def.key,
        event: def.event,
        group: def.group,
        description: def.description,
        email: def.email,
        inApp: def.inApp,
        sms: false,
        push: false,
        subject: def.subject,
        body: def.body,
        inAppTitle: def.inAppTitle,
        inAppMessage: def.inAppMessage,
        variables: def.variables,
      },
      update: {
        event: def.event,
        group: def.group,
        description: def.description,
        // Do not overwrite admin edits for subject/body/channels on re-seed —
        // only ensure structural fields stay aligned.
        variables: def.variables,
      },
    });
  }

  console.log(
    `Notification templates seeded for tanti: ${DEFAULT_NOTIFICATION_TEMPLATES.length}`,
  );
}
