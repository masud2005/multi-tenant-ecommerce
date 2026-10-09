'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Clock,
  MessageSquare,
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { supportService } from '@/services/support-service';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TOPICS = [
  { id: 'Order enquiry', label: 'Order enquiry', icon: '📦' },
  { id: 'Returns & exchanges', label: 'Returns & exchanges', icon: '🔄' },
  { id: 'Product question', label: 'Product question', icon: '🏷️' },
  { id: 'Other', label: 'Other questions', icon: '✨' },
];

export default function ContactPage() {
  const { tenant } = useTenant();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    topic: 'Order enquiry',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    phone: string;
  } | null>(null);

  const phone = tenant.contact?.phone || '09612-826842';
  const email = tenant.contact?.email || 'care@tanti.com.bd';
  const whatsapp = tenant.contact?.whatsapp || '+880 1700-000000';
  const address =
    tenant.contact?.address ||
    'House 14, Road 27 (old), Dhanmondi, Dhaka 1209';
  const hours = tenant.contact?.workingHours || 'Sat–Thu, 10 AM – 9 PM';
  const supportTeam =
    tenant.contact?.supportTeam || `${tenant.name} Care team`;
  const responseTime =
    tenant.contact?.responseTime || 'replies within 2 to 4 working hours';

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Please enter your name';
    if (!form.phone.trim())
      errs.phone = 'Please enter your phone or WhatsApp number';
    if (!form.message.trim() || form.message.trim().length < 5)
      errs.message = 'Please tell us a little more (at least 5 characters)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const res = await supportService.sendContactMessage({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: '',
        topic: form.topic,
        message: form.message.trim(),
      });

      const ticketId =
        res.data?.ticketId || `TK-${Date.now().toString().slice(-6)}`;
      setSubmittedTicket({
        ticketId,
        phone: form.phone,
      });
      toast.success('Your message has been sent to our customer care team!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:px-8">
      {/* Left Column: Direct Info & Channels */}
      <div className="flex flex-col justify-between">
        <div>
          {/* Live Customer Support Badge in clean white theme */}
          <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1 text-xs font-semibold text-ink shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-ink-muted animate-pulse" />
            Live Customer Support
          </div>

          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-ink font-normal leading-tight">
            Get in touch with us
          </h1>
          <p className="mt-3 max-w-md text-sm text-ink-soft leading-relaxed">
            Our {supportTeam} {responseTime}. We are always here to assist you with your orders and questions.
          </p>

          <dl className="mt-8 space-y-4 text-sm">
            {/* Phone */}
            <div className="flex gap-4 rounded-xl border border-line bg-surface/60 p-4 transition-all hover:border-ink/20 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Customer hotline</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  <a href={`tel:${phone}`} className="hover:underline">
                    {phone}
                  </a>
                </dd>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex gap-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 transition-all hover:border-emerald-500/40 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <dt className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  WhatsApp Support
                </dt>
                <dd className="mt-0.5 font-semibold text-emerald-900 dark:text-emerald-100">
                  {whatsapp}
                </dd>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 rounded-xl border border-line bg-surface/60 p-4 transition-all hover:border-ink/20 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Email inquiry</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  <a href={`mailto:${email}`} className="hover:underline">
                    {email}
                  </a>
                </dd>
              </div>
            </div>

            {/* Address */}
            <div className="flex gap-4 rounded-xl border border-line bg-surface/60 p-4 transition-all hover:border-ink/20 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Flagship store & office</dt>
                <dd className="mt-0.5 font-medium text-ink leading-relaxed">
                  {address}
                </dd>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4 rounded-xl border border-line bg-surface/60 p-4 transition-all hover:border-ink/20 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Operating hours</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {hours}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Security badge */}
        <div className="mt-8 flex items-center gap-2 text-xs text-ink-muted">
          <ShieldCheck className="h-4 w-4 text-ink-muted" />
          <span>All inquiries are directly forwarded to our store management desk.</span>
        </div>
      </div>

      {/* Right Column: Support Messaging Form Card */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
        {/* Support Header Bar in Clean White Theme */}
        <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-4 text-ink">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle font-display text-lg font-semibold text-ink border border-line-strong">
                {tenant.name.slice(0, 1)}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold leading-tight text-ink">
                  {tenant.name} Support
                </h2>
                <CheckCircle2 className="h-4 w-4 text-ink" />
              </div>
              <p className="text-xs text-ink-muted">
                Online · Direct Messaging Desk
              </p>
            </div>
          </div>
        </div>

        {/* Message Form Body */}
        <div className="bg-surface p-6 sm:p-8">
          {submittedTicket ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-subtle text-ink border border-line">
                <CheckCircle2 className="h-10 w-10 text-ink" />
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-ink">
                <Check className="h-3.5 w-3.5" />
                <Check className="-ml-2 h-3.5 w-3.5" />
                Message Delivered
              </div>
              <h3 className="mt-2 text-xl font-bold text-ink">
                Thank you! We received your message
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Reference ID:{' '}
                <span className="font-mono font-semibold text-ink">
                  #{submittedTicket.ticketId.slice(0, 8).toUpperCase()}
                </span>
              </p>
              <p className="mt-3 max-w-sm text-xs text-ink-soft leading-relaxed">
                Our support desk has received your ticket. We will reach out to your phone/WhatsApp at <b>{submittedTicket.phone}</b>.
              </p>

              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setForm({
                      name: '',
                      phone: '',
                      topic: 'Order enquiry',
                      message: '',
                    });
                  }}
                  className="cursor-pointer border border-line-strong bg-surface text-ink hover:bg-subtle"
                >
                  Send another inquiry
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  Select Inquiry Topic
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map((t) => {
                    const isSelected = form.topic === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, topic: t.id })}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition-all cursor-pointer',
                          isSelected
                            ? 'border-ink bg-subtle text-ink font-semibold shadow-xs'
                            : 'border-line bg-surface hover:border-ink/30 text-ink'
                        )}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Inputs Grid (Name & Phone only) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Your Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="e.g. Rahim Ahmed"
                />
                <Input
                  label="Phone / WhatsApp Number *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={errors.phone}
                  placeholder="017xxxxxxxx"
                />
              </div>

              {/* Message Textarea Box */}
              <div className="relative rounded-xl border border-line-strong bg-surface p-4 shadow-2xs focus-within:border-ink transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-ink">
                    Type Your Message *
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    {form.message.length} characters
                  </span>
                </div>
                <Textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  error={errors.message}
                  placeholder="Write your message here... (e.g. I would like to check size availability or delivery timeline)"
                  className="bg-transparent border-0 focus:ring-0 p-0 resize-none text-sm placeholder:text-ink-muted"
                />
              </div>

              {/* Action Button: Solid Black */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full sm:w-auto bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white font-medium px-8 py-2.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" /> Send Message
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
