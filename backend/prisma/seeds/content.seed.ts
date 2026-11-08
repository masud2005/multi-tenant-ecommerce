import { PrismaClient } from '../generated/client';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80';

type PolicySeed = {
  slug: string;
  title: string;
  heading: string;
  sections: { heading: string; body: string }[];
};

const POLICIES: PolicySeed[] = [
  {
    slug: 'shipping',
    title: 'Shipping Policy',
    heading: 'How we deliver your order across Bangladesh',
    sections: [
      {
        heading: 'Delivery areas',
        body: 'We deliver to all 64 districts of Bangladesh through our courier partners. International shipping is currently not available.',
      },
      {
        heading: 'Delivery times',
        body: 'Orders placed before 5 PM are usually dispatched the same day. Inside Dhaka: 1–2 working days. Outside Dhaka: 3–5 working days. Delays may occur during Eid and national holidays.',
      },
      {
        heading: 'Delivery charges',
        body: 'Inside Dhaka ৳70 (free on orders over ৳2,500). Outside Dhaka rates follow the rates shown at checkout. Cash on delivery orders may include a small handling fee.',
      },
      {
        heading: 'Failed delivery',
        body: 'The courier will attempt delivery up to 2 times. If unsuccessful, the parcel is returned to us and prepaid orders are refunded minus the delivery charge.',
      },
    ],
  },
  {
    slug: 'returns',
    title: 'Return Policy',
    heading: 'Easy 7-day returns & doorstep size exchange',
    sections: [
      {
        heading: 'Return window',
        body: 'You may request a return within 7 days of delivery. Items must be unworn, unwashed and have all original tags attached.',
      },
      {
        heading: 'Non-returnable items',
        body: 'Sarees, jewellery and innerwear are non-returnable unless they arrive damaged or defective. Sale items marked “Final sale” cannot be returned.',
      },
      {
        heading: 'How refunds work',
        body: 'Once we receive and inspect your item (usually within 2 working days), refunds are issued to your original payment method: bKash/Nagad within 3 days, cards within 7–10 days.',
      },
      {
        heading: 'Exchanges',
        body: 'Size exchanges are free inside Dhaka. Our courier delivers the replacement and collects the original in a single visit.',
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    heading: 'How Tanti Fashion collects and uses your information',
    sections: [
      {
        heading: 'What we collect',
        body: 'Your name, contact details, delivery addresses, order history and — if you consent — browsing behaviour to improve recommendations. We never store full card numbers; payments are processed by certified gateways.',
      },
      {
        heading: 'How we use it',
        body: 'To process and deliver orders, provide support, send transactional messages, and, with your permission, marketing updates.',
      },
      {
        heading: 'Your rights',
        body: 'You can view, update or delete your data from My Account, or email privacy@tanti.com.bd.',
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    heading: 'Terms that apply when you shop with Tanti Fashion',
    sections: [
      {
        heading: 'Using our store',
        body: 'By placing an order you confirm you are at least 18 years old or have parental consent, and that the information you provide is accurate.',
      },
      {
        heading: 'Pricing',
        body: 'All prices are in Bangladeshi Taka (৳) and include VAT where applicable. We reserve the right to correct pricing errors before an order is dispatched.',
      },
      {
        heading: 'Liability',
        body: 'Our liability is limited to the value of the goods purchased.',
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    heading: 'How we use cookies on tanti.com.bd',
    sections: [
      {
        heading: 'Essential cookies',
        body: 'Required for your cart, checkout and account to work. These cannot be turned off.',
      },
      {
        heading: 'Analytics cookies',
        body: 'Help us understand how the store is used so we can improve it. Only set with your consent.',
      },
      {
        heading: 'Marketing cookies',
        body: 'Used to show relevant Tanti ads on other platforms. Only set with your consent.',
      },
    ],
  },
];

const ABOUT_CONTENT = {
  title: 'Our story',
  heading: 'Handloom & contemporary fashion, woven in Bangladesh',
  heroImage: HERO_IMAGE,
  heroImageAlt: 'Couple in festive kurta and panjabi in a sunlit courtyard',
  storyParagraphs: [
    'Tanti Fashion started with a simple idea: make authentic Bangladeshi craftsmanship easy to wear every day. We work directly with weavers, dyers and makers so every piece carries a clear story — from pit-loom jamdani to linen co-ords.',
    'Today we ship across all 64 districts, with careful packaging, clear tracking and a support team that actually answers. Our online store is built for the same warmth you would feel walking into a neighbourhood atelier.',
  ],
  milestones: [
    { year: '2019', text: 'First jamdani collection launched from a small Dhanmondi studio.' },
    { year: '2022', text: 'Nationwide courier delivery and easy doorstep exchanges introduced.' },
    { year: '2025', text: 'Tanti Fashion online store opened for all of Bangladesh.' },
  ],
  stats: [
    { value: '64', label: 'Districts delivered' },
    { value: '7-day', label: 'Easy returns' },
    { value: '100+', label: 'Artisan partners' },
  ],
  ctaText: 'Shop the collection',
  ctaLink: '/shop',
  status: 'published',
  seoTitle: 'About Tanti Fashion',
  seoDescription:
    'Learn how Tanti Fashion works with Bangladeshi artisans to bring handloom and contemporary clothing to your door.',
};

const FAQ_ITEMS: { category: string; question: string; answer: string; order: number }[] = [
  {
    category: 'Orders',
    question: 'How can I track my order?',
    answer:
      'Use the Track order page with your order number and phone number, or see live status in My Account → Orders. You will also receive SMS updates at every step.',
    order: 1,
  },
  {
    category: 'Orders',
    question: 'Can I change or cancel my order?',
    answer:
      'You can cancel any order before it is packed from My Account → Orders. For changes, contact us within 2 hours of ordering.',
    order: 2,
  },
  {
    category: 'Payments',
    question: 'Which payment methods do you accept?',
    answer:
      'bKash, Nagad, Visa/Mastercard/Amex and mobile banking via SSLCommerz, and cash on delivery where available.',
    order: 3,
  },
  {
    category: 'Payments',
    question: 'My payment was deducted but the order failed. What now?',
    answer:
      'Do not worry — we verify every transaction with the gateway. If the payment is confirmed, your order will be placed automatically within 30 minutes; otherwise the amount is reversed within 5–7 working days.',
    order: 4,
  },
  {
    category: 'Delivery',
    question: 'How long does delivery take?',
    answer:
      '1–2 days inside Dhaka, 3–5 days to other districts. Express same/next-day delivery is available in selected Dhaka areas.',
    order: 5,
  },
  {
    category: 'Delivery',
    question: 'How much is delivery?',
    answer:
      '৳70 inside Dhaka (free over ৳2,500). Outside Dhaka rates are shown at checkout. Store pickup is free when available.',
    order: 6,
  },
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer:
      'Unworn items with tags can be returned within 7 days of delivery. Sarees and jewellery can only be returned if damaged. Refunds go to your original payment method.',
    order: 7,
  },
  {
    category: 'Returns',
    question: 'How do exchanges work?',
    answer:
      'Request an exchange from My Account → Orders. Our courier delivers the new size and collects the original at the same time inside Dhaka.',
    order: 8,
  },
  {
    category: 'Account',
    question: 'Do I need an account to order?',
    answer:
      'No — guest checkout is available. An account lets you track orders, save addresses and request returns in one click.',
    order: 9,
  },
];

export async function seedContent(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping content seed.');
    return;
  }

  // Announcement + contact (contact also seeds in admin; keep content-complete here)
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      announcement:
        'Free delivery inside Dhaka on orders over ৳2,500 · Easy 7-day returns',
      announcementEnabled: true,
      contact: {
        email: 'care@tanti.com.bd',
        phone: '09612-826842',
        whatsapp: '+880 1700-000000',
        address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
        workingHours: 'Sat–Thu, 10 AM – 9 PM',
        responseTime: 'Replies within 2 to 4 working hours',
        supportTeam: 'Tanti Care team',
      },
    },
  });
  console.log('Announcement bar + contact details seeded for tanti');

  await prisma.cmsPage.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'about' },
    },
    create: {
      tenantId: tenant.id,
      title: ABOUT_CONTENT.title,
      slug: 'about',
      status: 'published',
      author: 'Demo Owner',
      content: JSON.stringify(ABOUT_CONTENT),
    },
    update: {
      title: ABOUT_CONTENT.title,
      status: 'published',
      author: 'Demo Owner',
      content: JSON.stringify(ABOUT_CONTENT),
    },
  });
  console.log('About page seeded');

  for (const policy of POLICIES) {
    const content = {
      title: policy.title,
      heading: policy.heading,
      sections: policy.sections,
      status: 'published',
    };
    await prisma.cmsPage.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug: policy.slug },
      },
      create: {
        tenantId: tenant.id,
        title: policy.title,
        slug: policy.slug,
        status: 'published',
        author: 'Demo Owner',
        content: JSON.stringify(content),
      },
      update: {
        title: policy.title,
        status: 'published',
        author: 'Demo Owner',
        content: JSON.stringify(content),
      },
    });
  }
  console.log(`Policy pages seeded: ${POLICIES.map((p) => p.slug).join(', ')}`);

  await prisma.faqItem.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.faqItem.createMany({
    data: FAQ_ITEMS.map((item) => ({
      tenantId: tenant.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      order: item.order,
    })),
  });
  console.log(`FAQ items seeded: ${FAQ_ITEMS.length}`);
}
