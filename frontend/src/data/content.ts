import { images } from './images';

export const testimonials = [
  { name: 'Ayesha Siddiqua', location: 'Gulshan, Dhaka', quote: 'The jamdani I bought for my sister’s wedding felt like an heirloom. Delivered next day, wrapped beautifully.' },
  { name: 'Tanvir Ahmed', location: 'Chattogram', quote: 'Exchanging a size was genuinely easy — the courier swapped it at my door. That’s why I keep ordering.' },
  { name: 'Farhana Rahman', location: 'Sylhet', quote: 'Paid with bKash in seconds, and the tracking updates were spot on the whole way.' }
];

export const trustPoints = [
  { title: 'Made by artisans', body: 'Every piece is sourced directly from weavers and makers across Bangladesh.' },
  { title: '7-day easy returns', body: 'Free pickup from your door inside Dhaka. Refund or exchange, your choice.' },
  { title: 'Pay your way', body: 'bKash, Nagad, cards via SSLCommerz, or cash on delivery.' },
  { title: 'Delivery in 64 districts', body: '1–2 days in Dhaka, 3–5 days everywhere else.' }
];

export const blogPosts = [
  { slug: 'story-of-jamdani', title: 'Three weeks on a pit loom: the story of a jamdani', excerpt: 'We spent a week with master weaver Abdul Karim in Rupganj to understand what goes into every saree.', category: 'Craft', date: '2026-09-14', readTime: '6 min', image: images.saree, author: 'Tasnim Ara' },
  { slug: 'eid-styling-guide', title: 'The Eid 2026 styling guide', excerpt: 'Five looks from the new collection — from morning prayers to evening dawat.', category: 'Style', date: '2026-09-02', readTime: '4 min', image: images.hero, author: 'Rumana Hossain' },
  { slug: 'caring-for-linen', title: 'How to care for linen in monsoon season', excerpt: 'Keep your linen soft and mildew-free with these simple habits.', category: 'Care', date: '2026-08-18', readTime: '3 min', image: images.coord, author: 'Tasnim Ara' },
  { slug: 'leather-from-bhairab', title: 'Meet the cobblers of Bhairab', excerpt: 'Behind every pair of Pora sandals is a family workshop with three generations of skill.', category: 'Craft', date: '2026-07-29', readTime: '5 min', image: images.sandals, author: 'Imtiaz Kabir' }
];

export const faqs: { category: string; q: string; a: string }[] = [
  { category: 'Orders', q: 'How can I track my order?', a: 'Use the Track order page with your order number and phone number, or see live status in My Account → Orders. You will also receive SMS updates at every step.' },
  { category: 'Orders', q: 'Can I change or cancel my order?', a: 'You can cancel any order before it is packed from My Account → Orders. For changes, contact us within 2 hours of ordering.' },
  { category: 'Payments', q: 'Which payment methods do you accept?', a: 'bKash, Nagad, Visa/Mastercard/Amex and mobile banking via SSLCommerz, international cards via Stripe, and cash on delivery (৳20 fee).' },
  { category: 'Payments', q: 'My payment was deducted but the order failed. What now?', a: 'Do not worry — we verify every transaction with the gateway. If the payment is confirmed, your order will be placed automatically within 30 minutes; otherwise the amount is reversed within 5–7 working days.' },
  { category: 'Delivery', q: 'How long does delivery take?', a: '1–2 days inside Dhaka, 3–5 days to other districts. Express same/next-day delivery is available in Dhaka city.' },
  { category: 'Delivery', q: 'How much is delivery?', a: '৳70 inside Dhaka (free over ৳2,500), ৳100 in Gazipur & Narayanganj, ৳130 elsewhere. Store pickup is free.' },
  { category: 'Returns', q: 'What is your return policy?', a: 'Unworn items with tags can be returned within 7 days of delivery. Sarees and jewellery can only be returned if damaged. Refunds go to your original payment method or as store credit.' },
  { category: 'Returns', q: 'How do exchanges work?', a: 'Request an exchange from My Account → Orders. Our courier delivers the new size and collects the original at the same time.' },
  { category: 'Account', q: 'Do I need an account to order?', a: 'No — guest checkout is available. An account lets you track orders, save addresses and request returns in one click.' }
];

export const policies: Record<string, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  shipping: {
    title: 'Shipping Policy',
    updated: '2026-08-01',
    sections: [
      { heading: 'Delivery areas', body: 'We deliver to all 64 districts of Bangladesh through our courier partners Pathao and Steadfast. International shipping is currently not available.' },
      { heading: 'Delivery times', body: 'Orders placed before 5 PM are dispatched the same day. Inside Dhaka: 1–2 working days. Outside Dhaka: 3–5 working days. Delays may occur during Eid and national holidays.' },
      { heading: 'Delivery charges', body: 'Inside Dhaka ৳70 (free on orders over ৳2,500), Gazipur & Narayanganj ৳100, all other districts ৳130 for the first kg plus ৳20 per extra kg. Cash on delivery orders carry a ৳20 handling fee.' },
      { heading: 'Failed delivery', body: 'The courier will attempt delivery up to 2 times. If unsuccessful, the parcel is returned to us and prepaid orders are refunded minus the delivery charge.' }
    ]
  },
  returns: {
    title: 'Return & Refund Policy',
    updated: '2026-08-01',
    sections: [
      { heading: 'Return window', body: 'You may request a return within 7 days of delivery. Items must be unworn, unwashed and have all original tags attached.' },
      { heading: 'Non-returnable items', body: 'Sarees, jewellery and innerwear are non-returnable unless they arrive damaged or defective. Sale items marked “Final sale” cannot be returned.' },
      { heading: 'How refunds work', body: 'Once we receive and inspect your item (usually within 2 working days), refunds are issued to your original payment method: bKash/Nagad within 3 days, cards within 7–10 days. You may choose store credit for an instant refund.' },
      { heading: 'Exchanges', body: 'Size exchanges are free inside Dhaka. Our courier delivers the replacement and collects the original in a single visit.' }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    updated: '2026-06-15',
    sections: [
      { heading: 'What we collect', body: 'Your name, contact details, delivery addresses, order history and — if you consent — browsing behaviour to improve recommendations. We never store full card numbers; payments are processed by certified gateways.' },
      { heading: 'How we use it', body: 'To process and deliver orders, provide support, send transactional messages, and, with your permission, marketing updates.' },
      { heading: 'Your rights', body: 'You can view, update or delete your data from My Account, or email privacy@tanti.com.bd.' }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    updated: '2026-06-15',
    sections: [
      { heading: 'Using our store', body: 'By placing an order you confirm you are at least 18 years old or have parental consent, and that the information you provide is accurate.' },
      { heading: 'Pricing', body: 'All prices are in Bangladeshi Taka (৳) and include VAT where applicable. We reserve the right to correct pricing errors before an order is dispatched.' },
      { heading: 'Liability', body: 'Our liability is limited to the value of the goods purchased.' }
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    updated: '2026-06-15',
    sections: [
      { heading: 'Essential cookies', body: 'Required for your cart, checkout and account to work. These cannot be turned off.' },
      { heading: 'Analytics cookies', body: 'Help us understand how the store is used so we can improve it. Only set with your consent.' },
      { heading: 'Marketing cookies', body: 'Used to show relevant Tanti ads on other platforms. Only set with your consent.' }
    ]
  }
};

export const searchSynonyms: Record<string, string> = {
  punjabi: 'panjabi',
  panjabee: 'panjabi',
  sharee: 'saree',
  sari: 'saree',
  shoes: 'sneakers',
  kurti: 'kurta',
  bag: 'tote',
  earrings: 'jhumka'
};

export const popularSearches = ['Panjabi', 'Jamdani saree', 'Linen', 'Sneakers', 'Kurta set', 'Eid'];
