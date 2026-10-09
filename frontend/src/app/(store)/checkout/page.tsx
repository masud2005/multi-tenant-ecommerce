'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LockIcon, ChevronLeftIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useCartLines } from '@/hooks/useCartLines';
import { shippingMethods } from '@/data/shipping';
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
    district: '',
    area: '',
    label: '',
  }));

  const [shippingId, setShippingId] = useState('standard');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
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
    if (active.length === 0 && !placing) {
      router.replace('/cart');
    }
  }, [active.length, placing, router]);

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

  const methods = shippingMethods.filter((m) => m.available(address.district));
  useEffect(() => {
    if (!methods.some((m) => m.id === shippingId)) setShippingId('standard');
  }, [methods, shippingId]);

  const method = methods.find((m) => m.id === shippingId) ?? methods[0];
  const coupon = applied ? findCoupon(applied) : undefined;
  const totals = orderTotals({
    subtotal,
    coupon,
    shipping: method ? method.price(address.district, subtotal) : 0,
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

    if (!recipientName || recipientName.length < 2) {
      e.recipientName = 'Please enter full name (minimum 2 characters)';
    }
    if (!/^01[3-9]\d{8}$/.test(recipientPhone)) {
      e.recipientPhone = 'Please enter a valid 11-digit mobile number (e.g. 01700000000)';
    }
    if (!newAddr.line1 || newAddr.line1.trim().length < 3) {
      e.line1 = 'Please enter delivery address';
    }
    if (!newAddr.district) {
      e.district = 'Please select your district';
    }
    if (!newAddr.area) {
      e.area = 'Please select your thana';
    }

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstError = Object.values(e)[0];
      toast.error(firstError || 'Please fill in all required address fields');
      return;
    }

    try {
      setSavingAddress(true);
      const payload: Address = {
        id: `a${Date.now()}`,
        label: newAddr.label || 'Home',
        name: recipientName,
        phone: recipientPhone,
        line1: newAddr.line1.trim(),
        district: newAddr.district || 'Dhaka',
        area: newAddr.area || 'Dhanmondi',
        isDefaultShipping: true,
      };

      const res: any = await saveAddress(payload);
      const savedId = (res && typeof res === 'object' && res.id) ? res.id : payload.id;
      setAddressId(savedId);

      setNewAddr({
        name: '',
        phone: '',
        line1: '',
        district: '',
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
    } else {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('tanti_last_delivery_address', JSON.stringify(finalAddress));
        } catch {}
      }
    }

    await new Promise((r) => setTimeout(r, 400));
    const order = await placeOrder({
      contact: {
        name: finalAddress.name,
        email: user?.email || '',
        phone: finalAddress.phone,
      },
      address: finalAddress,
      shippingMethod: method.name,
      shippingCost: totals.shipping + totals.codFee,
      paymentMethod: payment,
      discount: totals.discount + totals.credit,
      couponCode: coupon?.code,
      subtotal,
      total: totals.total,
    });

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tanti.coupon');
    }
    const targetId = order.number || order.id;
    router.replace(payment === 'cod' ? `/order-confirmation/${targetId}` : `/pay/${targetId}`);
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
            isFreeShipping={coupon?.type === 'free_shipping'}
          />

          {/* Step 3: Payment Method */}
          <PaymentSection
            payment={payment}
            onSelectPayment={setPayment}
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
          shippingMethodName={method.name}
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
