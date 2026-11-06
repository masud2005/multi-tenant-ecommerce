import React from 'react';
import { BanknoteIcon, CheckCircle2, PhoneIcon, HashIcon, AlertCircle } from 'lucide-react';
import { Section } from './Section';
import type { PaymentMethod } from '@/types/commerce';

interface PaymentSectionProps {
  payment: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
  senderPhone: string;
  onSenderPhoneChange: (val: string) => void;
  transactionId: string;
  onTransactionIdChange: (val: string) => void;
  errors?: {
    senderPhone?: string;
    transactionId?: string;
  };
  totalAmount?: number;
  storePaymentConfig?: {
    bkashNumber?: string;
    bkashType?: string;
    nagadNumber?: string;
    nagadType?: string;
  };
}

export function PaymentSection({
  payment,
  onSelectPayment,
  senderPhone,
  onSenderPhoneChange,
  transactionId,
  onTransactionIdChange,
  errors,
  totalAmount = 0,
  storePaymentConfig,
}: PaymentSectionProps) {
  const bkashNumber = storePaymentConfig?.bkashNumber || '01700-000000';
  const bkashType = storePaymentConfig?.bkashType || 'Personal (Send Money)';
  const nagadNumber = storePaymentConfig?.nagadNumber || '01800-000000';
  const nagadType = storePaymentConfig?.nagadType || 'Personal (Send Money)';

  return (
    <Section step={3} title="Payment Method">
      <div className="space-y-4">
        {/* Option 1: Cash on Delivery */}
        <div
          onClick={() => onSelectPayment('cod')}
          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
            payment === 'cod'
              ? 'border-clay bg-clay/5 shadow-xs'
              : 'border-line bg-surface hover:border-line-strong'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                  payment === 'cod' ? 'bg-clay text-white' : 'bg-subtle text-ink-muted'
                }`}
              >
                <BanknoteIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Cash on Delivery (ক্যাশ অন ডেলিভারি)</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  পণ্য হাতে পাওয়ার পর ডেলিভারিম্যানকে ক্যাশ মূল্য পরিশোধ করুন।
                </p>
              </div>
            </div>
            {payment === 'cod' && <CheckCircle2 className="h-5 w-5 text-clay shrink-0 mt-0.5" />}
          </div>
        </div>

        {/* Option 2: Direct bKash Send Money */}
        <div
          onClick={() => onSelectPayment('bkash')}
          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
            payment === 'bkash'
              ? 'border-[#E2136E] bg-[#E2136E]/5 shadow-xs'
              : 'border-line bg-surface hover:border-line-strong'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 font-bold text-xs ${
                  payment === 'bkash' ? 'bg-[#E2136E] text-white' : 'bg-subtle text-ink-muted'
                }`}
              >
                bKash
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">bKash (বিকাশ সেন্ড মানি)</p>
                  <span className="text-[11px] font-medium text-[#E2136E] bg-[#E2136E]/10 px-2 py-0.5 rounded-full">
                    Manual Verification
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  আমাদের বিকাশ নাম্বারে সেন্ড মানি করে Transaction ID প্রদান করুন।
                </p>
              </div>
            </div>
            {payment === 'bkash' && <CheckCircle2 className="h-5 w-5 text-[#E2136E] shrink-0 mt-0.5" />}
          </div>

          {/* Expanded input fields when bKash is active */}
          {payment === 'bkash' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 pt-4 border-t border-line space-y-3 cursor-default"
            >
              <div className="rounded-md bg-[#E2136E]/10 p-3 text-xs text-[#E2136E]">
                <p className="font-semibold">
                  bKash Number: <span className="font-mono text-sm underline select-all">{bkashNumber}</span> ({bkashType})
                </p>
                <p className="mt-1 text-ink-muted">
                  মোট <b>৳{totalAmount}</b> টাকা পাঠাবেন। টাকা পাঠানোর পর নিচের ঘরে আপনার বিকাশ নাম্বার ও TrxID লিখে অর্ডার কনফার্ম করুন।
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    যে নাম্বার থেকে পাঠিয়েছেন (Your bKash No) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => onSenderPhoneChange(e.target.value)}
                      placeholder="017XXXXXXXX"
                      maxLength={14}
                      className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 text-sm text-ink focus:border-clay focus:outline-none"
                    />
                  </div>
                  {errors?.senderPhone && (
                    <p className="text-xs text-danger mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.senderPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Transaction ID (TrxID) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <HashIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
                      placeholder="e.g. 8N7A6B5C"
                      className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 font-mono text-sm uppercase text-ink focus:border-clay focus:outline-none"
                    />
                  </div>
                  {errors?.transactionId && (
                    <p className="text-xs text-danger mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.transactionId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Option 3: Direct Nagad Send Money */}
        <div
          onClick={() => onSelectPayment('nagad')}
          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
            payment === 'nagad'
              ? 'border-[#F7941D] bg-[#F7941D]/5 shadow-xs'
              : 'border-line bg-surface hover:border-line-strong'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 font-bold text-xs ${
                  payment === 'nagad' ? 'bg-[#F7941D] text-white' : 'bg-subtle text-ink-muted'
                }`}
              >
                Nagad
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">Nagad (নগদ সেন্ড মানি)</p>
                  <span className="text-[11px] font-medium text-[#F7941D] bg-[#F7941D]/10 px-2 py-0.5 rounded-full">
                    Manual Verification
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  আমাদের নগদ নাম্বারে সেন্ড মানি করে Transaction ID প্রদান করুন।
                </p>
              </div>
            </div>
            {payment === 'nagad' && <CheckCircle2 className="h-5 w-5 text-[#F7941D] shrink-0 mt-0.5" />}
          </div>

          {/* Expanded input fields when Nagad is active */}
          {payment === 'nagad' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 pt-4 border-t border-line space-y-3 cursor-default"
            >
              <div className="rounded-md bg-[#F7941D]/10 p-3 text-xs text-[#F7941D]">
                <p className="font-semibold">
                  Nagad Number: <span className="font-mono text-sm underline select-all">{nagadNumber}</span> ({nagadType})
                </p>
                <p className="mt-1 text-ink-muted">
                  মোট <b>৳{totalAmount}</b> টাকা পাঠাবেন। টাকা পাঠানোর পর নিচের ঘরে আপনার নগদ নাম্বার ও TrxID লিখে অর্ডার কনফার্ম করুন।
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    যে নাম্বার থেকে পাঠিয়েছেন (Your Nagad No) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => onSenderPhoneChange(e.target.value)}
                      placeholder="018XXXXXXXX"
                      maxLength={14}
                      className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 text-sm text-ink focus:border-clay focus:outline-none"
                    />
                  </div>
                  {errors?.senderPhone && (
                    <p className="text-xs text-danger mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.senderPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Transaction ID (TrxID) <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <HashIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" />
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
                      placeholder="e.g. 7M8B9C0D"
                      className="h-9 w-full rounded-md border border-line-strong bg-canvas pl-8 pr-3 font-mono text-sm uppercase text-ink focus:border-clay focus:outline-none"
                    />
                  </div>
                  {errors?.transactionId && (
                    <p className="text-xs text-danger mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.transactionId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
