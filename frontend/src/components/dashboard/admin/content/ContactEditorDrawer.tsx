'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  ShieldCheck,
  Eye,
  Plus,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { storeService } from '@/services/store-service';

export interface ContactDetailsData {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  supportTeam: string;
  responseTime: string;
}

export interface ContactEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ContactEditorDrawer({
  open,
  onClose,
  onSaved,
}: ContactEditorDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ContactDetailsData>({
    phone: '09612-826842',
    whatsapp: '+880 1700-000000',
    email: 'care@tanti.com.bd',
    address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
    workingHours: 'Sat–Thu, 10 AM – 9 PM',
    supportTeam: 'Tanti Care team',
    responseTime: 'Replies within 2 to 4 working hours',
  });

  // Load existing store contact info on open
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    async function loadContactSettings() {
      try {
        setLoading(true);
        const res = await storeService.getOwnerSettings();
        if (isMounted && res?.data?.contact) {
          const c = res.data.contact;
          setForm((prev) => ({
            phone: c.phone || prev.phone,
            whatsapp: c.whatsapp || prev.whatsapp,
            email: c.email || prev.email,
            address: c.address || prev.address,
            workingHours: c.workingHours || prev.workingHours,
            supportTeam: c.supportTeam || prev.supportTeam,
            responseTime: c.responseTime || prev.responseTime,
          }));
        }
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContactSettings();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Reset / Clear form for creating new contact details
  const handleResetForNew = () => {
    setForm({
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      workingHours: '',
      supportTeam: '',
      responseTime: '',
    });
    toast.info('Fields cleared to create new contact details');
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await storeService.updateOwnerSettings({
        contact: {
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          workingHours: form.workingHours.trim(),
          supportTeam: form.supportTeam.trim(),
          responseTime: form.responseTime.trim(),
        },
      });

      toast.success('Contact details updated successfully!');
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to update contact settings:', err);
      toast.error(err?.message || 'Failed to update contact settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Contact Page Details"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              window.open('/contact', '_blank');
              toast.success('Opening live contact page preview...');
            }}
            className="text-sm font-normal text-ink hover:underline cursor-pointer px-2 py-1 flex items-center gap-1.5"
          >
            <Eye className="h-4 w-4 text-ink-muted" /> Preview
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleUpdate}
              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 px-6 py-5">
        {/* Direct Support Channels Box */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            DIRECT SUPPORT CHANNELS
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-ink-muted" /> Customer Hotline *
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 09612-826842"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Support Number *
              </label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="e.g. +880 1700-000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-ink-muted" /> Official Support Email *
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="care@tanti.com.bd"
            />
          </div>
        </div>

        {/* Location & Schedule Box */}
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-2xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            LOCATION & SCHEDULE
          </h3>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-muted" /> Flagship Store & Office Address
            </label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. House 14, Road 27 (old), Dhanmondi, Dhaka 1209"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ink-muted" /> Operating Hours
              </label>
              <Input
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                placeholder="e.g. Sat–Thu, 10 AM – 9 PM"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-ink-muted" /> Support Team Name
              </label>
              <Input
                value={form.supportTeam}
                onChange={(e) => setForm({ ...form, supportTeam: e.target.value })}
                placeholder="e.g. Tanti Care team"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Response Time Note
            </label>
            <Input
              value={form.responseTime}
              onChange={(e) => setForm({ ...form, responseTime: e.target.value })}
              placeholder="e.g. Replies within 2 to 4 working hours"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
