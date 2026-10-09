'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { paymentMethods } from '@/data/shipping';
import { formatBDT } from '@/utils/format';
import Link from 'next/link';
import { orderService, mapBackendOrderToFrontend } from '@/services/order-service';
import type { Order } from '@/types/commerce';

type Step = 'account' | 'otp' | 'card' | 'verifying';

interface PaymentPageProps {
  params: Promise<{ orderId: string }>;
}

export default function PaymentGatewayPage({ params }: PaymentPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const { orders, completePayment } = useStore();
  
  // Find order from local store state by ID or order number
  const matchedOrder = orders.find((o) => o.id === orderId || o.number === orderId);
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!matchedOrder);

  // If not found in memory, query backend API directly
  useEffect(() => {
    if (!matchedOrder && orderId) {
      setIsLoading(true);
      orderService
        .getOrderDetail(orderId)
        .then((res) => {
          if (res?.data) {
            setDbOrder(mapBackendOrderToFrontend(res.data));
          }
        })
        .catch((err) => {
          console.warn('Could not fetch order from backend:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [matchedOrder, orderId]);

  const order = matchedOrder || dbOrder;

  const isWallet =
    order?.paymentMethod === 'bkash' || order?.paymentMethod === 'nagad';
  const [step, setStep] = useState<Step>(isWallet ? 'account' : 'card');
  const [wallet, setWallet] = useState(order?.phone.replace('-', '') ?? '');
  const [otp, setOtp] = useState('');
  const [card, setCard] = useState({
    number: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    name: order?.customerName ?? '',
  });
  const [error, setError] = useState('');

  // Sync wallet and card details when order loads asynchronously
  useEffect(() => {
    if (order) {
      if (!wallet && order.phone) setWallet(order.phone.replace('-', ''));
      if (!card.name && order.customerName) {
        setCard((prev) => ({ ...prev, name: order.customerName }));
      }
      setStep(order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad' ? 'account' : 'card');
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF0F3]">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="h-8 w-8 animate-spin text-clay" />
          <p className="text-sm text-ink-muted">Loading secure payment...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-medium text-ink">Order not found</p>
        <Link href="/" className="mt-4 inline-block text-sm text-clay underline">
          Return home
        </Link>
      </div>
    );
  }

  const gw = paymentMethods.find((p) => p.id === order.paymentMethod) ?? {
    name: 'Payment Gateway',
    color: '#1C1A17',
  };

  const finish = async (result: 'success' | 'fail' | 'cancel') => {
    const target = order.number || order.id;
    if (result === 'cancel') {
      completePayment(order.id, 'cancel');
      router.replace(`/order-confirmation/${target}`);
      return;
    }
    setStep('verifying');
    await new Promise((r) => setTimeout(r, 1400));
    completePayment(order.id, result);
    router.replace(`/order-confirmation/${target}`);
  };

  const gatewayName =
    order.paymentMethod === 'sslcommerz'
      ? 'SSLCommerz'
      : order.paymentMethod === 'stripe'
      ? 'Stripe'
      : gw.name;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#EEF0F3] px-4 py-10 font-sans">
      <p className="mb-4 flex items-center gap-1.5 text-xs text-[#5B6470]">
        <LockIcon className="h-3 w-3" aria-hidden /> Simulated {gatewayName} payment page
      </p>
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-pop">
        <div className="px-6 py-5 text-white" style={{ backgroundColor: gw.color }}>
          <p className="text-lg font-bold">{gatewayName}</p>
          <p className="mt-0.5 text-xs text-white/85">Secure payment gateway</p>
        </div>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 text-sm">
          <div>
            <p className="font-medium text-[#111827]">Tanti Lifestyle Ltd.</p>
            <p className="text-xs text-[#6B7280]">Invoice {order.number}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-[#111827]">
            {formatBDT(order.total)}
          </p>
        </div>

        <div className="px-6 py-6">
          {step === 'verifying' && (
            <div className="flex flex-col items-center py-8 text-center" role="status">
              <Loader2Icon
                className="h-8 w-8 animate-spin"
                style={{ color: gw.color }}
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-[#111827]">
                Verifying payment…
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Please don’t close this window. Tanti is confirming the transaction with{' '}
                {gatewayName}.
              </p>
            </div>
          )}

          {step === 'account' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^01\d{9}$/.test(wallet)) {
                  return setError(`Enter your 11-digit ${gw.name} account number`);
                }
                setError('');
                setStep('otp');
              }}
              noValidate
            >
              <label htmlFor="wallet" className="text-sm font-medium text-[#111827]">
                Your {gw.name} account number
              </label>
              <input
                id="wallet"
                inputMode="numeric"
                value={wallet}
                onChange={(e) =>
                  setWallet(e.target.value.replace(/\D/g, '').slice(0, 11))
                }
                placeholder="01XXXXXXXXX"
                className="mt-2 h-11 w-full rounded-md border border-[#D1D5DB] px-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2"
              />
              {error && <p className="mt-1.5 text-xs text-[#B42318]">{error}</p>}
              <p className="mt-3 text-xs text-[#6B7280]">
                By continuing you agree to the {gw.name} terms and conditions.
              </p>
              <button
                type="submit"
                className="mt-5 h-11 w-full rounded-md text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: gw.color }}
              >
                Confirm
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otp.length < 6) return setError('Enter the 6-digit code');
                setError('');
                finish('success');
              }}
              noValidate
            >
              <label htmlFor="otp" className="text-sm font-medium text-[#111827]">
                Verification code & PIN
              </label>
              <p className="mt-1 text-xs text-[#6B7280]">
                A code was sent to {wallet}. Enter it below, then your PIN on the next screen of
                your {gw.name} app.
              </p>
              <input
                id="otp"
                inputMode="numeric"
                autoFocus
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="••••••"
                className="mt-3 h-11 w-full rounded-md border border-[#D1D5DB] px-3 text-center text-lg tracking-[0.5em] focus:outline-none"
              />
              {error && <p className="mt-1.5 text-xs text-[#B42318]">{error}</p>}
              <button
                type="submit"
                className="mt-5 h-11 w-full rounded-md text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: gw.color }}
              >
                Pay {formatBDT(order.total)}
              </button>
            </form>
          )}

          {step === 'card' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                finish('success');
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="cc" className="text-xs font-medium text-[#374151]">
                  Card number
                </label>
                <input
                  id="cc"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] px-3 text-sm tracking-wider focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp" className="text-xs font-medium text-[#374151]">
                    Expiry
                  </label>
                  <input
                    id="exp"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] px-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="text-xs font-medium text-[#374151]">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cn" className="text-xs font-medium text-[#374151]">
                  Name on card
                </label>
                <input
                  id="cn"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] px-3 text-sm focus:outline-none"
                />
              </div>
              {order.paymentMethod === 'sslcommerz' && (
                <p className="text-xs text-[#6B7280]">
                  Also accepts Rocket, Upay, DBBL Nexus and internet banking.
                </p>
              )}
              <button
                type="submit"
                className="mt-2 h-11 w-full rounded-md text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: gw.color }}
              >
                Pay {formatBDT(order.total)}
              </button>
            </form>
          )}
        </div>

        {step !== 'verifying' && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-3 text-xs">
            <button
              type="button"
              onClick={() => finish('cancel')}
              className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
            >
              Cancel payment
            </button>
            <button
              type="button"
              onClick={() => finish('fail')}
              className="text-[#B42318] hover:underline cursor-pointer"
            >
              Simulate failure
            </button>
          </div>
        )}
      </div>
      <p className="mt-5 flex items-center gap-1.5 text-xs text-[#5B6470]">
        <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden /> PCI-DSS compliant · 256-bit encryption
      </p>
    </div>
  );
}
