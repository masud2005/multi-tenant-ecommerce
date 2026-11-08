'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeftIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useTenant } from '@/contexts/TenantContext';
import { useCartLines } from '@/hooks/useCartLines';
import { storeService } from '@/services/store-service';
import { discountService, type ApplyDiscountResult } from '@/services/discount-service';
import { orderTotals } from '@/utils/pricing';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Address, PaymentMethod } from '@/types/commerce';
import {
  parseStoreShipping,
  type StoreShippingSettings,
} from '@/utils/store-shipping';
import {
  AddressSection,
  DeliveryMethodSection,
  PaymentSection,
  OrderSummarySection,
  type NewAddressFormData,
} from '@/components/store/checkout';

type Errors = Partial<Record<string, string>>;

type PaymentConfig = {
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  nagadType: string;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  codEnabled: boolean;
};

const EMPTY_PAYMENT: PaymentConfig = {
  bkashNumber: '',
  bkashType: '',
  nagadNumber: '',
  nagadType: '',
  bkashEnabled: false,
  nagadEnabled: false,
  codEnabled: true,
};

function readPaymentFlag(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen w-full bg-canvas" aria-busy="true" aria-label="Loading checkout">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[28rem] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    user,
    addresses,
    placeOrder,
    saveAddress,
    cart,
    isCartLoading,
    isProductsLoading,
  } = useStore();
  const { shipping: tenantShipping, isLoading: tenantLoading } = useTenant();
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

  const [shippingConfig, setShippingConfig] =
    useState<StoreShippingSettings>(tenantShipping);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(EMPTY_PAYMENT);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const isCheckoutBootstrapping =
    !user ||
    !!isCartLoading ||
    !!isProductsLoading ||
    !settingsLoaded ||
    tenantLoading;

  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<ApplyDiscountResult | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      toast.error('Please log in to proceed to checkout and place your order.');
      router.replace('/login?next=/checkout');
    }
  }, [user, router]);

  // Keep shipping in sync with Admin → Shipping (TenantContext)
  useEffect(() => {
    setShippingConfig(tenantShipping);
  }, [tenantShipping]);

  // Live payment settings from public store-info — no mock fallbacks
  useEffect(() => {
    let mounted = true;
    const slug =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('tenant_slug') || '').trim()) ||
      'tanti';

    storeService
      .getPublicStoreInfo(slug)
      .then((res) => {
        if (!mounted) return;
        const s = (res?.data as any)?.settings || {};
        const pay = s.payment || {};
        const pm = s.pm || {};

        if (s.shipping) {
          setShippingConfig(parseStoreShipping(s.shipping));
        }

        setPaymentConfig({
          bkashNumber: String(pay.bkashNumber || '').trim(),
          bkashType: String(pay.bkashType || '').trim(),
          nagadNumber: String(pay.nagadNumber || '').trim(),
          nagadType: String(pay.nagadType || '').trim(),
          bkashEnabled: readPaymentFlag(pay.bkashEnabled ?? pm.bkash, false),
          nagadEnabled: readPaymentFlag(pay.nagadEnabled ?? pm.nagad, false),
          codEnabled: readPaymentFlag(pay.codEnabled ?? pm.cod, true),
        });
      })
      .catch(() => {
        if (mounted) setPaymentConfig(EMPTY_PAYMENT);
      })
      .finally(() => {
        if (mounted) setSettingsLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Prefer an enabled payment method once settings load (admin Payments tab)
  useEffect(() => {
    if (!settingsLoaded) return;
    const enabled: PaymentMethod[] = [];
    if (paymentConfig.codEnabled) enabled.push('cod');
    if (paymentConfig.bkashEnabled) enabled.push('bkash');
    if (paymentConfig.nagadEnabled) enabled.push('nagad');
    if (enabled.length && !enabled.includes(payment)) {
      setPayment(enabled[0]);
    }
  }, [settingsLoaded, paymentConfig, payment]);

  // Only redirect after cart + products have finished loading — never during bootstrap
  // or while an order is being placed (cart clears before confirmation navigation)
  useEffect(() => {
    if (!user || placing || submitting.current || isCartLoading || isProductsLoading) return;
    const pendingQty = cart.filter((item) => !item.savedForLater).length;
    if (pendingQty > 0 && active.length === 0) return;
    if (active.length === 0) {
      toast.message('Your bag is empty');
      router.replace('/cart');
    }
  }, [
    user,
    placing,
    isCartLoading,
    isProductsLoading,
    cart,
    active.length,
    router,
  ]);

  // Re-validate coupon from session via backend only
  useEffect(() => {
    if (!user || subtotal <= 0) return;
    const saved =
      typeof window !== 'undefined' ? sessionStorage.getItem('tanti.coupon') : null;
    if (!saved) return;

    let mounted = true;
    discountService
      .applyDiscount({
        code: saved,
        subtotal,
        customerEmail: user.email,
      })
      .then((res) => {
        if (!mounted || !res?.data) return;
        setAppliedDiscount(res.data);
        setCode(res.data.code);
      })
      .catch(() => {
        if (typeof window !== 'undefined') sessionStorage.removeItem('tanti.coupon');
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate once when cart/user ready
  }, [user?.email, subtotal > 0]);

  const address: Address = useMemo(() => {
    const saved = addresses.find((a) => a.id === addressId);
    return (
      saved ?? {
        id: `a${Date.now()}`,
        ...newAddr,
        label: newAddr.label || 'Home',
        district: newAddr.district || 'Dhaka',
        area: newAddr.area || '',
        name: newAddr.name,
        phone: newAddr.phone,
      }
    );
  }, [addresses, addressId, newAddr]);

  const isDhaka = (address.district || '').toLowerCase().trim() === 'dhaka';
  const isFreeThreshold =
    shippingConfig.freeDeliveryThreshold > 0 &&
    subtotal >= shippingConfig.freeDeliveryThreshold;
  const isFreeShipping = Boolean(appliedDiscount?.isFreeShipping || isFreeThreshold);

  const baseShippingCost = isDhaka
    ? shippingConfig.insideDhaka
    : shippingConfig.outsideDhaka;
  const calculatedShippingCost =
    shippingId === 'pickup' || isFreeShipping ? 0 : baseShippingCost;

  const shippingMethodName =
    shippingId === 'pickup'
      ? 'Store pickup'
      : isDhaka
        ? `Inside Dhaka Delivery (৳${shippingConfig.insideDhaka})`
        : `Outside Dhaka Delivery (৳${shippingConfig.outsideDhaka})`;

  const methods = useMemo(() => {
    const standardPrice = isFreeShipping ? 0 : baseShippingCost;
    const list = [
      {
        id: 'standard',
        name: isDhaka ? 'Inside Dhaka Delivery' : 'Outside Dhaka Delivery',
        description: isDhaka
          ? 'Delivery within Dhaka metropolitan area'
          : 'Delivery to districts outside Dhaka',
        eta: isDhaka ? shippingConfig.insideDhakaEst : shippingConfig.outsideDhakaEst,
        price: standardPrice,
      },
    ];
    if (shippingConfig.pickup) {
      list.push({
        id: 'pickup',
        name: 'Store pickup',
        description: 'Collect from store — free',
        eta: 'Ready today',
        price: 0,
      });
    }
    return list;
  }, [isDhaka, shippingConfig, baseShippingCost, isFreeShipping]);

  useEffect(() => {
    if (shippingId === 'pickup' && !shippingConfig.pickup) {
      setShippingId('standard');
    }
  }, [shippingId, shippingConfig.pickup]);

  const appliedCoupon = appliedDiscount
    ? {
        code: appliedDiscount.code,
        label: appliedDiscount.title || 'Discount',
        type:
          appliedDiscount.type === 'FREE_SHIPPING'
            ? ('free_shipping' as const)
            : appliedDiscount.type === 'PERCENTAGE'
              ? ('percent' as const)
              : ('fixed' as const),
        value: appliedDiscount.value,
      }
    : undefined;

  const baseTotals = orderTotals({
    subtotal,
    coupon: appliedCoupon,
    shipping: calculatedShippingCost,
    cod: payment === 'cod',
  });

  const totals = appliedDiscount
    ? {
        ...baseTotals,
        discount: appliedDiscount.discountAmount,
        shipping: calculatedShippingCost,
        total: Math.max(
          0,
          subtotal -
            appliedDiscount.discountAmount +
            calculatedShippingCost +
            (payment === 'cod' ? baseTotals.codFee : 0)
        ),
      }
    : baseTotals;

  const validate = () => {
    const e: Errors = {};

    if (addressId === 'new') {
      const recipientName = (newAddr.name || '').trim();
      let recipientPhone = (newAddr.phone || '').trim().replace(/[\s-]/g, '');
      if (recipientPhone.startsWith('+88')) recipientPhone = recipientPhone.slice(3);
      if (recipientPhone.startsWith('88') && recipientPhone.length === 13) {
        recipientPhone = recipientPhone.slice(2);
      }

      if (!recipientName || recipientName.length < 2) e.recipientName = 'Enter full name';
      if (!/^01[3-9]\d{8}$/.test(recipientPhone)) e.recipientPhone = 'Enter mobile number';
      if (!newAddr.line1 || newAddr.line1.trim().length < 3) e.line1 = 'Enter delivery address';
      if (!newAddr.district) e.district = 'Select district';
      if (!newAddr.area) e.area = 'Select thana';
    }

    if (payment === 'bkash' || payment === 'nagad') {
      let phone = senderPhone.trim().replace(/[\s-]/g, '');
      if (phone.startsWith('+88')) phone = phone.slice(3);
      if (phone.startsWith('88') && phone.length === 13) phone = phone.slice(2);
      if (!/^01[3-9]\d{8}$/.test(phone)) e.senderPhone = 'Enter sender mobile number';
      if (!transactionId.trim() || transactionId.trim().length < 5) {
        e.transactionId = 'Enter transaction ID';
      }
      if (payment === 'bkash' && !paymentConfig.bkashNumber) {
        e.payment = 'bKash is not configured for this store';
      }
      if (payment === 'nagad' && !paymentConfig.nagadNumber) {
        e.payment = 'Nagad is not configured for this store';
      }
    }

    if (!consent) e.consent = 'Please accept the terms to continue';
    return e;
  };

  const applyCode = async () => {
    if (!code.trim()) return;
    setIsValidatingCoupon(true);
    setCodeError('');

    try {
      const res = await discountService.applyDiscount({
        code: code.trim(),
        subtotal,
        customerEmail: user?.email,
      });

      if (res?.data) {
        setAppliedDiscount(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tanti.coupon', res.data.code);
        }
        toast.success(`${res.data.code} applied — ${res.data.title || 'Discount applied'}`);
        return;
      }
      setAppliedDiscount(null);
      setCodeError('Invalid or expired coupon code');
    } catch (err: any) {
      setAppliedDiscount(null);
      setCodeError(err?.message || 'Invalid or expired coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSaveAddressExplicitly = async () => {
    const e: Errors = {};
    const recipientName = (newAddr.name || '').trim();
    let recipientPhone = (newAddr.phone || '').trim().replace(/[\s-]/g, '');
    if (recipientPhone.startsWith('+88')) recipientPhone = recipientPhone.slice(3);
    if (recipientPhone.startsWith('88') && recipientPhone.length === 13) {
      recipientPhone = recipientPhone.slice(2);
    }

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
      toast.error(e.payment || 'Please fix the highlighted fields');
      return;
    }
    if (active.length === 0) {
      toast.error('Your bag is empty');
      router.push('/cart');
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

    try {
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
        discount: totals.discount,
        couponCode: appliedDiscount?.code,
        senderPhone: payment === 'bkash' || payment === 'nagad' ? senderPhone : undefined,
        transactionId: payment === 'bkash' || payment === 'nagad' ? transactionId : undefined,
        subtotal,
        total: totals.total,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('tanti.coupon');
      }

      if (!order) {
        toast.error('Could not place order. Please try again.');
        submitting.current = false;
        setPlacing(false);
        return;
      }

      const targetId = order.number || order.id;
      // Keep placing/submitting true so empty-cart guard does not bounce to /cart
      router.replace(`/order-confirmation/${encodeURIComponent(targetId)}`);
    } catch (err: any) {
      console.error('Place order failed:', err);
      toast.error(err?.message || 'Could not place order. Please try again.');
      submitting.current = false;
      setPlacing(false);
    }
  };

  if (isCheckoutBootstrapping) {
    return <CheckoutSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-canvas">
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

          <DeliveryMethodSection
            methods={methods}
            selectedMethodId={shippingId}
            onSelectMethod={setShippingId}
            isDhaka={isDhaka}
            district={address.district}
            rates={{
              insideDhaka: shippingConfig.insideDhaka,
              outsideDhaka: shippingConfig.outsideDhaka,
              insideEst: shippingConfig.insideDhakaEst,
              outsideEst: shippingConfig.outsideDhakaEst,
            }}
            isFreeShipping={isFreeShipping}
          />

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

        <OrderSummarySection
          items={active}
          code={code}
          onCodeChange={setCode}
          onApplyCode={applyCode}
          codeError={codeError}
          appliedCoupon={appliedCoupon}
          isApplyingCode={isValidatingCoupon}
          subtotal={subtotal}
          totals={totals}
          shippingMethodName={shippingMethodName}
          shippingIsFree={isFreeShipping || shippingId === 'pickup'}
          paymentMethod={payment}
          hasIssues={hasIssues}
          canPlaceOrder={active.length > 0 && settingsLoaded}
          consent={consent}
          onConsentChange={setConsent}
          consentError={errors.consent}
          isPlacing={placing}
        />
      </form>
    </div>
  );
}
