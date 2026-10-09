import React from 'react';
import { BanknoteIcon, CheckCircle2 } from 'lucide-react';
import { Section } from './Section';
import type { PaymentMethod } from '@/types/commerce';

interface PaymentSectionProps {
  payment?: PaymentMethod;
  onSelectPayment?: (method: PaymentMethod) => void;
}

export function PaymentSection({}: PaymentSectionProps) {
  return (
    <Section step={3} title="Payment Method">
      <div className="rounded-lg border-2 border-clay bg-clay-soft/15 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay text-white shrink-0">
              <BanknoteIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">
                  Cash on Delivery (ক্যাশ অন ডেলিভারি)
                </p>
                <span className="text-[11px] font-medium text-clay bg-clay/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                পণ্য হাতে পাওয়ার পর ডেলিভারিম্যানকে ক্যাশ টাকা প্রদান করবেন। কোনো অগ্রিম অনলাইন পেমেন্টের ঝামেলা নেই।
              </p>
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-clay shrink-0 mt-0.5" />
        </div>
      </div>
    </Section>
  );
}
