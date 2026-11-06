'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LockIcon, ChevronLeftIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useCartLines } from '@/hooks/useCartLines';
import { storeService } from '@/services/store-service';
import { findCoupon, orderTotals } from '@/utils/pricing';
import { formatBDT } from '@/utils/format';
import type { Address, PaymentMethod } from '@/types/commerce';
import {
  AddressSection,
  DeliveryMethodSection,
  PaymentSection,
  OrderSummarySection,
  type NewAddressFormData,
} from '@/components/store/checkout';

type Errors = Partial<Record<string, string>>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, addresses, storeCredit, placeOrder, saveAddress } = useStore();
  const { active, subtotal, hasIssues } = useCartLines();
  const defaultAddr = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];

  const [addressId, setAddressId] = useState<string>(() => {
    if (defaultAddr) return defaultAddr.id;
    return 'new';
  });

  const [newAddr, setNewAddr] = useState<NewAddressFormData>(() => ({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    line1: '',
    district: 'Dhaka',
    area: '',
    label: '',
  }));

  const [shippingId, setShippingId] = useState('standard');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [transactionId, setTransactionId] = useState('');

  // Shipping & Payment configuration from store settings
  const [shippingConfig, setShippingConfig] = useState({
    insideDhaka: 60,
    outsideDhaka: 120,
    freeShippingThreshold: 2500,
  });
  const [paymentConfig, setPaymentConfig] = useState({
    bkashNumber: '01712-345678',
    bkashType: 'Personal (Send Money)',
    nagadNumber: '01812-345678',
    nagadType: 'Personal (Send Money)',
  });

  const [useCredit, setUseCredit] = useState(false);
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tanti.coupon') ?? '';
    }
    return '';
  });
  const [applied, setApplied] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tanti.coupon') ?? '';
    }
    return '';
  });
  const [codeError, setCodeError] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const submitting = useRef(false);

  // Require authentication for checkout
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      toast.error('Please log in to proceed to checkout and place your order.');
      router.replace('/login?next=/checkout');
    }
  }, [user, router]);

  // Load live store shipping & payment configurations
  useEffect(() => {
    storeService
      .getPublicStoreInfo()
      .then((res) => {
        const s = (res?.data as any)?.settings;
        if (s?.shipping) {
          setShippingConfig({
            insideDhaka: Number(s.shipping.insideDhaka) || 60,
            outsideDhaka: Number(s.shipping.outsideDhaka) || 120,
            freeShippingThreshold: Number(s.shipping.freeShippingThreshold) || 2500,
          });
        }
        if (s?.payment) {
          setPaymentConfig({
            bkashNumber: s.payment.bkashNumber || '01712-345678',
            bkashType: s.payment.bkashType || 'Personal (Send Money)',
            nagadNumber: s.payment.nagadNumber || '01812-345678',
            nagadType: s.payment.nagadType || 'Personal (Send Money)',
          });
        }
      })
      .catch(() => {});
  }, []);

  // Auto-select saved/previous address if available when addresses hydrate
  useEffect(() => {
    if (addresses.length > 0) {
      if (addressId === 'new' && !newAddr.line1) {
        const def = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
        if (def) {
          setAddressId(def.id);
        }
      }
    }
  }, [addresses]);

  useEffect(() => {
    if (user && active.length === 0 && !placing) {
      router.replace('/cart');
    }
  }, [user, active.length, placing, router]);

  const address: Address = useMemo(() => {
    const saved = addresses.find((a) => a.id === addressId);
    return (
      saved ?? {
        id: `a${Date.now()}`,
        ...newAddr,
        label: newAddr.label || 'Home',
        district: newAddr.district || 'Dhaka',
        area: newAddr.area || 'Dhanmondi',
        name: newAddr.name,
        phone: newAddr.phone,
      }
    );
  }, [addresses, addressId, newAddr]);

  // Dynamic Shipping Calculation (Dhaka vs Outside Dhaka)
  const isDhaka = (address.district || '').toLowerCase().trim() === 'dhaka';
  const coupon = applied ? findCoupon(applied) : undefined;
  const isFreeThreshold =
    shippingConfig.freeShippingThreshold > 0 &&
    subtotal >= shippingConfig.freeShippingThreshold;
  const isFreeShipping = coupon?.type === 'free_shipping' || isFreeThreshold;
  const calculatedShippingCost = isFreeShipping
    ? 0
    : isDhaka
    ? shippingConfig.insideDhaka
    : shippingConfig.outsideDhaka;

  const shippingMethodName = isDhaka
    ? `Dhaka Inside Delivery (৳${shippingConfig.insideDhaka})`
    : `Outside Dhaka Delivery (৳${shippingConfig.outsideDhaka})`;

  const methods = [
    {
      id: 'standard',
      name: isDhaka ? 'Inside Dhaka Delivery' : 'Outside Dhaka Delivery',
      description: isDhaka
        ? 'Delivery within Dhaka metropolitan area'
        : 'Delivery to all 63 districts outside Dhaka',
      eta: isDhaka ? '1–2 business days' : '2–4 business days',
      price: () => calculatedShippingCost,
      available: () => true,
    },
  ];

  const totals = orderTotals({
    subtotal,
    coupon,
    shipping: calculatedShippingCost,
    cod: payment === 'cod',
    storeCredit: useCredit ? storeCredit : 0,
  });

  const validate = () => {
    const e: Errors = {};

    if (addressId === 'new') {
      const recipientName = (newAddr.name || '').trim();
      let recipientPhone = (newAddr.phone || '').trim().replace(/[\s-]/g, '');
      if (recipientPhone.startsWith('+88')) recipientPhone = recipientPhone.slice(3);
      if (recipientPhone.startsWith('88') && recipientPhone.length === 13) recipientPhone = recipientPhone.slice(2);

      if (!recipientName || recipientName.length < 2) e.recipientName = 'Enter full name';
      if (!/^01[3-9]\d{8}$/.test(recipientPhone)) e.recipientPhone = 'Enter mobile number';
      if (!newAddr.line1 || newAddr.line1.trim().length < 3)
        e.line1 = 'Enter delivery address';
      if (!newAddr.district)
        e.district = 'Select district';
      if (!newAddr.area)
        e.area = 'Select thana';
    }

    if (payment === 'bkash' || payment === 'nagad') {
      const pClean = (senderPhone || '').trim().replace(/[\s-]/g, '');
      if (!/^01[3-9]\d{8}$/.test(pClean)) {
        e.senderPhone = 'Enter your 11-digit mobile number';
      }
      if (!transactionId || transactionId.trim().length < 5) {
        e.transactionId = 'Enter Transaction ID (TrxID)';
      }
    }

    if (!consent) e.consent = 'Please accept the terms to continue';
    return e;
  };

  const applyCode = () => {
    const c = findCoupon(code);
    if (!c) return setCodeError('Invalid code');
    if (c.minSubtotal && subtotal < c.minSubtotal)
      return setCodeError(`Requires a subtotal of ${formatBDT(c.minSubtotal)}`);
    setCodeError('');
    setApplied(c.code);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tanti.coupon', c.code);
    }
  };

  const handleSaveAddressExplicitly = async () => {
    const e: Errors = {};
    const recipientName = (newAddr.name || '').trim();
    let recipientPhone = (newAddr.phone || '').trim().replace(/[\s-]/g, '');
    if (recipientPhone.startsWith('+88')) recipientPhone = recipientPhone.slice(3);
    if (recipientPhone.startsWith('88') && recipientPhone.length === 13) recipientPhone = recipientPhone.slice(2);

    if (!recipientName || recipientName.length < 2) e.recipientName = 'Enter full name';
    if (!/^01[3-9]\d{8}$/.test(recipientPhone)) e.recipientPhone = 'Enter 11-digit mobile number';
    if (!newAddr.line1 || newAddr.line1.trim().length < 3) e.line1 = 'Enter address';
    if (!newAddr.district) e.district = 'Select district';
    if (!newAddr.area) e.area = 'Select thana';

    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Please fill in address fields correctly before saving');
      return;
    }

    try {
      setSavingAddress(true);
      const payload: Address = {
        id: `a${Date.now()}`,
        name: recipientName,
        phone: recipientPhone,
        line1: newAddr.line1.trim(),
        district: newAddr.district,
        area: newAddr.area,
        label: newAddr.label || 'Home',
        isDefaultShipping: addresses.length === 0,
      };

      const res: any = await saveAddress(payload);
      const savedId = res && typeof res === 'object' && res.id ? res.id : payload.id;
      setAddressId(savedId);

      setNewAddr({
        name: '',
        phone: '',
        line1: '',
        district: 'Dhaka',
        area: '',
        label: '',
      });
      setErrors({});

      toast.success('Address saved successfully!');
    } catch {
      toast.error('Could not save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting.current) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      first?.focus();
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (hasIssues) {
      toast.error(
        'Some items are no longer available in the requested quantity. Review your bag.'
      );
      router.push('/cart');
      return;
    }
    submitting.current = true;
    setPlacing(true);

    let finalAddress = address;
    if (addressId === 'new') {
      try {
        const savedResult: any = await saveAddress({
          ...address,
          label: newAddr.label || 'Home',
          isDefaultShipping: addresses.length === 0,
        });
        if (savedResult && typeof savedResult === 'object' && savedResult.id) {
          finalAddress = {
            ...address,
            id: savedResult.id,
            label: savedResult.label || newAddr.label || 'Home',
          };
        }
      } catch (err) {
        console.error('Failed to save address:', err);
      }
    }

    const order = await placeOrder({
      contact: {
        name: finalAddress.name,
        email: user?.email || '',
        phone: finalAddress.phone,
      },
      address: finalAddress,
      shippingMethod: shippingMethodName,
      shippingCost: calculatedShippingCost,
      paymentMethod: payment,
      discount: totals.discount + totals.credit,
      couponCode: coupon?.code,
      senderPhone: payment === 'bkash' || payment === 'nagad' ? senderPhone : undefined,
      transactionId: payment === 'bkash' || payment === 'nagad' ? transactionId : undefined,
      subtotal,
      total: totals.total,
    });

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tanti.coupon');
    }
    const targetId = order.number || order.id;
    router.replace(`/order-confirmation/${targetId}`);
  };

  return (
    <div className="min-h-screen w-full bg-canvas">
      {/* Header */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-2xl">
            Tanti
          </Link>
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            <LockIcon className="h-3.5 w-3.5" aria-hidden /> Secure checkout
          </span>
        </div>
      </header>

      {/* Main Checkout Form */}
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px]"
      >
        <div className="space-y-10">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden /> Back to bag
          </Link>

          {/* Step 1: Delivery Address */}
          <AddressSection
            addresses={addresses}
            selectedAddressId={addressId}
            onSelectAddressId={setAddressId}
            newAddress={newAddr}
            onNewAddressChange={setNewAddr}
            isLoggedIn={!!user}
            errors={errors}
            onClearError={(field) =>
              setErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            onSaveAddress={handleSaveAddressExplicitly}
            isSavingAddress={savingAddress}
          />

          {/* Step 2: Delivery Method */}
          <DeliveryMethodSection
            methods={methods}
            selectedMethodId={shippingId}
            onSelectMethod={setShippingId}
            district={address.district}
            subtotal={subtotal}
            isFreeShipping={isFreeShipping}
          />

          {/* Step 3: Payment Method (COD, bKash, Nagad) */}
          <PaymentSection
            payment={payment}
            onSelectPayment={setPayment}
            senderPhone={senderPhone}
            onSenderPhoneChange={setSenderPhone}
            transactionId={transactionId}
            onTransactionIdChange={setTransactionId}
            errors={errors}
            totalAmount={totals.total}
            storePaymentConfig={paymentConfig}
          />
        </div>

        {/* Sidebar: Order Summary & Place Order */}
        <OrderSummarySection
          items={active}
          code={code}
          onCodeChange={setCode}
          onApplyCode={applyCode}
          codeError={codeError}
          appliedCoupon={coupon}
          isLoggedIn={!!user}
          storeCredit={storeCredit}
          useCredit={useCredit}
          onToggleCredit={setUseCredit}
          subtotal={subtotal}
          totals={totals}
          shippingMethodName={shippingMethodName}
          paymentMethod={payment}
          hasIssues={hasIssues}
          consent={consent}
          onConsentChange={setConsent}
          consentError={errors.consent}
          isPlacing={placing}
        />
      </form>
    </div>
  );
}
