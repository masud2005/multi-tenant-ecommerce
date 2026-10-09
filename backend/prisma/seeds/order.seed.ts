import { PrismaClient, OrderStatus, FulfillmentStatus, PaymentStatus, PaymentMethod, OrderChannel } from '../generated/client';

export async function seedOrders(prisma: PrismaClient) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tanti' },
  });

  if (!tenant) {
    console.log('Tenant "tanti" not found, skipping order seed.');
    return;
  }



  const sampleOrders = [
    {
      customerName: 'Tanvir Hossain',
      phone: '01711000001',
      email: 'tanvir@gmail.com',
      district: 'Dhaka',
      area: 'Dhanmondi',
      line1: 'House 42, Road 9/A',
      total: 12500,
      subtotal: 12400,
      shipping: 100,
      paymentMethod: PaymentMethod.BKASH,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Farhana Akhter',
      phone: '01811000002',
      email: 'farhana@gmail.com',
      district: 'Dhaka',
      area: 'Gulshan 2',
      line1: 'Apt 5B, Road 44',
      total: 18600,
      subtotal: 18500,
      shipping: 100,
      paymentMethod: PaymentMethod.SSLCOMMERZ,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Shafiqul Islam',
      phone: '01911000003',
      email: 'shafiq@gmail.com',
      district: 'Chattogram',
      area: 'GEC Circle',
      line1: '12 Nasirabad Housing Society',
      total: 9400,
      subtotal: 9250,
      shipping: 150,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Mehedi Hasan',
      phone: '01611000004',
      email: 'mehedi@gmail.com',
      district: 'Sylhet',
      area: 'Zindabazar',
      line1: 'East Amberkhana Road',
      total: 6800,
      subtotal: 6650,
      shipping: 150,
      paymentMethod: PaymentMethod.BKASH,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.SHIPPED,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Nusrat Jahan',
      phone: '01711000005',
      email: 'nusrat@gmail.com',
      district: 'Gazipur',
      area: 'Joydebpur',
      line1: 'Bhawal Road, House 8',
      total: 5200,
      subtotal: 5100,
      shipping: 100,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PROCESSING,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Ariful Haque',
      phone: '01811000006',
      email: 'ariful@gmail.com',
      district: 'Narayanganj',
      area: 'Chashara',
      line1: 'BB Road, Plaza 3',
      total: 4700,
      subtotal: 4600,
      shipping: 100,
      paymentMethod: PaymentMethod.NAGAD,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Mahmudul Karim',
      phone: '01911000007',
      email: 'mahmud@gmail.com',
      district: 'Rajshahi',
      area: 'Shaheb Bazar',
      line1: 'Station Road',
      total: 3900,
      subtotal: 3750,
      shipping: 150,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.CONFIRMED,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Sadia Sultana',
      phone: '01711000008',
      email: 'sadia@gmail.com',
      district: 'Khulna',
      area: 'Shibbari',
      line1: 'Khan Jahan Ali Road',
      total: 3200,
      subtotal: 3050,
      shipping: 150,
      paymentMethod: PaymentMethod.BKASH,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Tasnim Ahmed',
      phone: '01611000009',
      email: 'tasnim@gmail.com',
      district: 'Cumilla',
      area: 'Kandirpar',
      line1: 'Nazrul Avenue',
      total: 2800,
      subtotal: 2650,
      shipping: 150,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      customerName: 'Imran Chowdhury',
      phone: '01811000010',
      email: 'imran@gmail.com',
      district: 'Dhaka',
      area: 'Uttara Sector 7',
      line1: 'Road 12, House 25',
      total: 7600,
      subtotal: 7500,
      shipping: 100,
      paymentMethod: PaymentMethod.BKASH,
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  let counter = 1001;
  for (const item of sampleOrders) {
    const orderNumber = `ORD-2026-${counter++}`;
    const existing = await prisma.order.findUnique({
      where: {
        tenantId_number: {
          tenantId: tenant.id,
          number: orderNumber,
        },
      },
    });

    if (!existing) {
      await prisma.order.create({
        data: {
          tenantId: tenant.id,
          number: orderNumber,
          customerName: item.customerName,
          phone: item.phone,
          email: item.email,
          subtotal: item.subtotal,
          total: item.total,
          shipping: item.shipping,
          discount: 0,
          tax: 0,
          refunded: 0,
          status: item.status,
          fulfillmentStatus:
            item.status === OrderStatus.DELIVERED
              ? FulfillmentStatus.FULFILLED
              : FulfillmentStatus.UNFULFILLED,
          paymentStatus: item.paymentStatus,
          paymentMethod: item.paymentMethod,
          channel: OrderChannel.ONLINE,
          shippingMethod: 'Standard Delivery',
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
          shippingAddress: {
            create: {
              name: item.customerName,
              phone: item.phone,
              line1: item.line1,
              area: item.area,
              district: item.district,
            },
          },
        },
      });
    }
  }

  console.log(`Seeded realistic orders across Bangladesh districts successfully.`);
}
