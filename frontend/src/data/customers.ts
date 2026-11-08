import type { Address, Customer, SupportTicket } from '../types/commerce';

export const customers: Customer[] = [
  { id: 'c01', name: 'Nusrat Jahan', email: 'nusrat.jahan@gmail.com', phone: '01712-345678', district: 'Dhaka', orders: 9, spent: 38450, lastOrder: '2026-09-22', joined: '2025-02-11', tags: ['eid-buyer', 'newsletter'], segment: 'VIP', status: 'active', marketingConsent: true },
  { id: 'c02', name: 'Tanvir Ahmed', email: 'tanvir.a@outlook.com', phone: '01819-223344', district: 'Chattogram', orders: 4, spent: 14200, lastOrder: '2026-09-21', joined: '2025-11-03', tags: ['menswear'], segment: 'Loyal', status: 'active', marketingConsent: true },
  { id: 'c03', name: 'Farhana Rahman', email: 'farhana.r@yahoo.com', phone: '01911-556677', district: 'Sylhet', orders: 1, spent: 8500, lastOrder: '2026-09-24', joined: '2026-09-24', tags: [], segment: 'New', status: 'active', marketingConsent: false },
  { id: 'c04', name: 'Rafiq Hossain', email: 'rafiq.h@gmail.com', phone: '01556-778899', district: 'Dhaka', orders: 6, spent: 21980, lastOrder: '2026-09-25', joined: '2025-06-19', tags: ['footwear'], segment: 'Loyal', status: 'active', marketingConsent: true },
  { id: 'c05', name: 'Sadia Islam', email: 'sadia.islam@gmail.com', phone: '01674-112233', district: 'Rajshahi', orders: 2, spent: 5480, lastOrder: '2026-06-12', joined: '2026-01-08', tags: [], segment: 'At risk', status: 'active', marketingConsent: true },
  { id: 'c06', name: 'Kabir Traders Ltd.', email: 'purchase@kabirtraders.com', phone: '01711-908070', district: 'Narayanganj', orders: 14, spent: 186000, lastOrder: '2026-09-18', joined: '2025-03-30', tags: ['b2b', 'wholesale'], segment: 'Wholesale', status: 'active', marketingConsent: false },
  { id: 'c07', name: 'Mehedi Hasan', email: 'mehedi.h@gmail.com', phone: '01533-445566', district: 'Khulna', orders: 3, spent: 9870, lastOrder: '2026-09-19', joined: '2025-12-21', tags: [], segment: 'Loyal', status: 'active', marketingConsent: true },
  { id: 'c08', name: 'Ayesha Siddiqua', email: 'ayesha.s@gmail.com', phone: '01798-667788', district: 'Dhaka', orders: 11, spent: 52300, lastOrder: '2026-09-23', joined: '2024-10-02', tags: ['vip', 'eid-buyer'], segment: 'VIP', status: 'active', marketingConsent: true },
  { id: 'c09', name: 'Imran Chowdhury', email: 'imran.c@hotmail.com', phone: '01822-990011', district: 'Cumilla', orders: 1, spent: 2690, lastOrder: '2026-09-20', joined: '2026-09-20', tags: [], segment: 'New', status: 'active', marketingConsent: false },
  { id: 'c10', name: 'Shirin Akter', email: 'shirin.akter@gmail.com', phone: '01615-334455', district: 'Bogura', orders: 0, spent: 0, lastOrder: '', joined: '2026-09-15', tags: [], segment: 'New', status: 'inactive', marketingConsent: true },
  { id: 'c11', name: 'Arif Mahmud', email: 'arif.m@gmail.com', phone: '01733-221100', district: 'Gazipur', orders: 5, spent: 17650, lastOrder: '2026-09-17', joined: '2025-08-08', tags: [], segment: 'Loyal', status: 'active', marketingConsent: true },
  { id: 'c12', name: 'Lamia Karim', email: 'lamia.karim@gmail.com', phone: '01944-887766', district: 'Dhaka', orders: 2, spent: 6480, lastOrder: '2026-09-16', joined: '2026-05-02', tags: [], segment: 'New', status: 'active', marketingConsent: true }
];

export const currentUserAddresses: Address[] = [
  { id: 'a1', label: 'Home', name: 'Nusrat Jahan', phone: '01712-345678', line1: 'House 42, Road 9/A', area: 'Dhanmondi', district: 'Dhaka', isDefaultShipping: true, isDefaultBilling: true },
  { id: 'a2', label: 'Office', name: 'Nusrat Jahan', phone: '01712-345678', line1: 'Level 6, Navana Tower, 45 Gulshan Ave', area: 'Gulshan', district: 'Dhaka' },
  { id: 'a3', label: "Parents' home", name: 'Rokeya Begum', phone: '01819-000111', line1: 'Holding 118, Zindabazar Road', area: 'Zindabazar', district: 'Sylhet' }
];

export const supportTickets: SupportTicket[] = [
  {
    id: 'T-2041',
    subject: 'Exchange size for panjabi',
    orderNumber: 'TN-10482',
    status: 'awaiting',
    updatedAt: '2026-09-24T10:12:00',
    messages: [
      { from: 'customer', name: 'Nusrat Jahan', text: 'Hi, I ordered the Sage Panjabi in M for my brother but he needs an L. Can I exchange?', at: '2026-09-23T18:40:00' },
      { from: 'agent', name: 'Mitu · Tanti Care', text: 'Of course! I have opened an exchange for you — L is in stock. Our courier will pick up the M when delivering the L. Could you confirm the pickup address is still Dhanmondi?', at: '2026-09-24T10:12:00' }
    ]
  },
  {
    id: 'T-1987',
    subject: 'bKash payment deducted but order failed',
    orderNumber: 'TN-10311',
    status: 'resolved',
    updatedAt: '2026-08-30T14:02:00',
    messages: [
      { from: 'customer', name: 'Nusrat Jahan', text: 'My bKash was charged ৳1,990 but the site showed payment failed.', at: '2026-08-29T21:10:00' },
      { from: 'agent', name: 'Rakib · Tanti Care', text: 'We verified the transaction with bKash (TrxID 9HX2K1L0P) and confirmed your order. Sorry for the trouble!', at: '2026-08-30T14:02:00' }
    ]
  }
];
