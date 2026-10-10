'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Globe,
  Save,
  CheckCircle2,
  Share2,
  Sparkles,
  CreditCard,
  ShoppingCart,
  Percent,
  RotateCcw,
  Users,
  ShieldCheck,
  Server,
  Building,
  RefreshCw,
} from 'lucide-react';
import { paymentMethods } from '@/data/shipping';
import { useAdmin } from '@/contexts/AdminContext';
import { useTenant } from '@/contexts/TenantContext';
import { storeService } from '@/services/store-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'Store Profile', label: 'Store Profile', icon: Store },
  { id: 'Checkout', label: 'Checkout & Orders', icon: ShoppingCart },
  { id: 'Payments', label: 'Payment Gateways', icon: CreditCard },
  { id: 'Taxes', label: 'Taxes & VAT', icon: Percent },
  { id: 'Returns', label: 'Returns Policy', icon: RotateCcw },
  { id: 'Customer accounts', label: 'Customer Accounts', icon: Users },
  { id: 'Privacy', label: 'Privacy & Cookies', icon: ShieldCheck },
  { id: 'Availability', label: 'Store Status', icon: Server },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function AdminSettingsPage() {
  const { can } = useAdmin();
  const { tenant, refetchTenant } = useTenant();
  const [section, setSection] = useState<SectionId>('Store Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Store Identity Form State
  const [storeForm, setStoreForm] = useState({
    name: 'Tanti Fashion',
    tagline: 'Handloom & Contemporary Bangladeshi Fashion',
    logo: '/images/tanti-logo.svg',
    favicon: '/favicon.ico',
    currency: 'BDT',
    currencySymbol: '৳',
    currencyPosition: 'prefix' as 'prefix' | 'suffix',
    timezone: '(GMT+06:00) Dhaka',
    language: 'English',
    orderNumberFormat: 'TN-{number}',
    announcement: 'Use EID500 for ৳500 off orders over ৳3,000.',
    announcementEnabled: true,
  });

  // 2. Public Contact Details Form State
  const [contactForm, setContactForm] = useState({
    email: 'care@tanti.com.bd',
    phone: '09612-826842',
    whatsapp: '+880 1700-000000',
    address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
    workingHours: 'Sat–Thu, 10 AM – 9 PM',
    responseTime: 'Replies within 2 to 4 working hours',
    supportTeam: 'Tanti Care team',
  });

  // 3. Social Media Form State
  const [socialsForm, setSocialsForm] = useState({
    facebook: 'https://facebook.com/tanti',
    instagram: 'https://instagram.com/tanti',
  });

  // 4. Payment Methods State
  const [pm, setPm] = useState<Record<string, boolean>>({
    bkash: true,
    nagad: true,
    sslcommerz: true,
    stripe: true,
    cod: true,
  });

  // 5. Flags State
  const [flags, setFlags] = useState({
    guest: true,
    phoneOtp: true,
    notes: true,
    maintenance: false,
    cookie: true,
    social: true,
    mfa: false,
    vatIncl: true,
    vatShip: false,
    photos: true,
    exchanges: true,
    finalSale: true,
    vatRate: '7.5',
    binNumber: '004512876-0101',
    returnWindow: '7',
  });

  const setFlag = (k: keyof typeof flags) => (v: boolean) =>
    setFlags((prev) => ({ ...prev, [k]: v }));

  // Load existing settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const res = await storeService.getOwnerSettings();
        if (res && res.data) {
          const d = res.data;
          setStoreForm((prev) => ({
            ...prev,
            name: d.name || prev.name,
            tagline: d.tagline || prev.tagline,
            logo: d.logo || prev.logo,
            favicon: d.favicon || prev.favicon,
            currency: d.currency || prev.currency,
            currencySymbol: d.currencySymbol || prev.currencySymbol,
            currencyPosition: d.currencyPosition || prev.currencyPosition,
            orderNumberFormat:
              d.settings?.orderNumberFormat || prev.orderNumberFormat,
            announcement: d.announcement || prev.announcement,
            announcementEnabled:
              d.announcementEnabled !== undefined
                ? d.announcementEnabled
                : prev.announcementEnabled,
          }));

          if (d.contact) {
            setContactForm((prev) => ({
              ...prev,
              email: d.contact.email || prev.email,
              phone: d.contact.phone || prev.phone,
              whatsapp: d.contact.whatsapp || prev.whatsapp,
              address: d.contact.address || prev.address,
              workingHours: d.contact.workingHours || prev.workingHours,
              responseTime: d.contact.responseTime || prev.responseTime,
              supportTeam:
                d.contact.supportTeam || `${d.name || 'Store'} Care team`,
            }));
          }

          if (d.socials) {
            setSocialsForm((prev) => ({
              ...prev,
              facebook: d.socials.facebook || prev.facebook,
              instagram: d.socials.instagram || prev.instagram,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save changes handler with rich feedback
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload: any = {
        name: storeForm.name,
        tagline: storeForm.tagline,
        currency: storeForm.currency,
        currencySymbol: storeForm.currencySymbol,
        currencyPosition: storeForm.currencyPosition,
        announcement: storeForm.announcement,
        announcementEnabled: storeForm.announcementEnabled,
        contact: {
          email: contactForm.email,
          phone: contactForm.phone,
          whatsapp: contactForm.whatsapp,
          address: contactForm.address,
          workingHours: contactForm.workingHours,
          responseTime: contactForm.responseTime,
          supportTeam: contactForm.supportTeam,
        },
        socials: socialsForm,
        settings: {
          orderNumberFormat: storeForm.orderNumberFormat,
          flags,
          pm,
        },
      };

      await storeService.updateOwnerSettings(payload);
      await refetchTenant();
      toast.success(`${section} settings saved & published successfully!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleGate module="settings">
      <div className="w-full space-y-6 pb-12">
        {/* Top Header */}
        <PageHeader
          title="Store Settings & Configuration"
          description="Manage store branding, public customer care channels, and business rules."
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetchTenant()}
                className="cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
              </Button>
              <GuardedButton
                module="settings"
                action="settings"
                size="sm"
                loading={isSaving}
                onClick={handleSave}
                className="cursor-pointer bg-ink text-canvas hover:bg-ink/90 font-medium px-4"
              >
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </GuardedButton>
            </div>
          }
        />

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-subtle/40 px-5 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="font-medium text-ink">Active Storefront:</span>
            <span className="font-semibold text-clay">{tenant.name}</span>
            <span className="text-ink-muted">({tenant.slug}.yourdomain.com)</span>
          </div>
          <div className="flex items-center gap-4 text-ink-muted">
            <span>Currency: <b>{storeForm.currency} ({storeForm.currencySymbol})</b></span>
            <span>Plan: <b className="uppercase text-ink">{tenant.plan}</b></span>
            <Badge tone="success" dot>Live Sync Ready</Badge>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Left Navigation Sidebar */}
          <nav
            aria-label="Settings sections"
            className="flex gap-1.5 overflow-x-auto md:flex-col"
          >
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  aria-current={isActive}
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-ink text-canvas shadow-sm'
                      : 'text-ink-soft hover:bg-subtle hover:text-ink'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-canvas' : 'text-ink-muted')} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Main Form Content */}
          <fieldset
            disabled={!can('settings', 'settings')}
            className="space-y-6"
          >
            {/* 1. STORE PROFILE TAB */}
            {section === 'Store Profile' && (
              <div className="space-y-6">
                {/* Brand Identity Card */}
                <Panel
                  title="Brand Identity & Store Naming"
                  description="General information about your business shown to customers."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Store brand name *"
                        value={storeForm.name}
                        onChange={(e) =>
                          setStoreForm({ ...storeForm, name: e.target.value })
                        }
                        placeholder="e.g. Tanti Fashion"
                        hint="This is the main public brand name displayed across your website"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Brand Tagline / Slogan"
                        value={storeForm.tagline}
                        onChange={(e) =>
                          setStoreForm({ ...storeForm, tagline: e.target.value })
                        }
                        placeholder="e.g. Handloom & Contemporary Bangladeshi Fashion"
                        hint="A brief sentence describing your craft and uniqueness"
                      />
                    </div>
                  </div>
                </Panel>

                {/* Regional & Currency Card */}
                <Panel
                  title="Localization, Currency & Orders"
                  description="Regional formats, pricing currency, and order code configuration."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Currency code"
                      value={storeForm.currency}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, currency: e.target.value.toUpperCase() })
                      }
                      placeholder="BDT"
                    />
                    <Input
                      label="Currency symbol"
                      value={storeForm.currencySymbol}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, currencySymbol: e.target.value })
                      }
                      placeholder="৳"
                    />
                    <Select
                      label="Currency symbol position"
                      value={storeForm.currencyPosition === 'prefix' ? 'Before price (e.g. ৳1,500)' : 'After price (e.g. 1,500 ৳)'}
                      onChange={(e) =>
                        setStoreForm({
                          ...storeForm,
                          currencyPosition: e.target.value.includes('Before') ? 'prefix' : 'suffix',
                        })
                      }
                      options={['Before price (e.g. ৳1,500)', 'After price (e.g. 1,500 ৳)']}
                    />
                    <Input
                      label="Order number format"
                      value={storeForm.orderNumberFormat}
                      onChange={(e) =>
                        setStoreForm({
                          ...storeForm,
                          orderNumberFormat: e.target.value,
                        })
                      }
                      placeholder="TN-{number}"
                      hint="Next order number will look like: TN-10498"
                    />
                  </div>
                </Panel>

                {/* Announcement Banner */}
                <Panel
                  title="Top Announcement Bar"
                  description="Highlight promotions, discount codes, or shipping notices across all pages."
                >
                  <div className="space-y-4">
                    <Switch
                      checked={storeForm.announcementEnabled}
                      onChange={(v) =>
                        setStoreForm({ ...storeForm, announcementEnabled: v })
                      }
                      label="Show top announcement bar on storefront"
                    />
                    <Input
                      label="Banner text"
                      value={storeForm.announcement}
                      onChange={(e) =>
                        setStoreForm({ ...storeForm, announcement: e.target.value })
                      }
                      placeholder="e.g. Use EID500 for ৳500 off orders over ৳3,000."
                    />
                  </div>
                </Panel>

                {/* Social Media Profiles */}
                <Panel
                  title="Social Media Profiles"
                  description="Connect your brand's official Facebook and Instagram pages."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Facebook Page URL"
                      value={socialsForm.facebook}
                      onChange={(e) =>
                        setSocialsForm({ ...socialsForm, facebook: e.target.value })
                      }
                      placeholder="https://facebook.com/yourbrand"
                      hint="Direct link to your official Facebook page"
                    />
                    <Input
                      label="Instagram Profile URL"
                      value={socialsForm.instagram}
                      onChange={(e) =>
                        setSocialsForm({ ...socialsForm, instagram: e.target.value })
                      }
                      placeholder="https://instagram.com/yourbrand"
                      hint="Direct link to your official Instagram profile"
                    />
                  </div>
                </Panel>
              </div>
            )}

            {/* 2. CHECKOUT TAB */}
            {section === 'Checkout' && (
              <Panel title="Checkout & Order Processing Rules">
                <div className="space-y-4">
                  <Switch
                    checked={flags.guest}
                    onChange={setFlag('guest')}
                    label="Allow guest checkout without requiring account creation"
                  />
                  <Switch
                    checked={flags.phoneOtp}
                    onChange={setFlag('phoneOtp')}
                    label="Verify customer phone by OTP for Cash on Delivery orders"
                  />
                  <Switch
                    checked={flags.notes}
                    onChange={setFlag('notes')}
                    label="Show order special notes field during checkout"
                  />
                  <Input
                    label="Unpaid order hold time (minutes)"
                    defaultValue="30"
                    hint="Reserved inventory is automatically released back to stock after this time"
                  />
                </div>
              </Panel>
            )}

            {/* 4. PAYMENTS TAB */}
            {section === 'Payments' && (
              <Panel title="Configured Payment Methods" flush>
                <ul className="divide-y divide-line">
                  {paymentMethods.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-subtle/30"
                    >
                      <PaymentMark method={m.id} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">
                          {m.name}
                        </p>
                        <p className="text-xs text-ink-muted">{m.description}</p>
                      </div>
                      <Switch
                        checked={!!pm[m.id]}
                        onChange={(v) => setPm({ ...pm, [m.id]: v })}
                        label={`Enable ${m.name}`}
                        hideLabel
                      />
                    </li>
                  ))}
                </ul>
                <p className="border-t border-line px-5 py-3.5 text-xs text-ink-muted bg-subtle/20">
                  Gateway API credentials and merchant secrets are encrypted at rest in your tenant keystore.
                </p>
              </Panel>
            )}

            {/* 5. TAXES TAB */}
            {section === 'Taxes' && (
              <Panel title="VAT & Government Tax Settings">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Standard VAT rate (%)"
                    value={flags.vatRate}
                    onChange={(e) => setFlags({ ...flags, vatRate: e.target.value })}
                  />
                  <Input
                    label="Business Identification Number (BIN)"
                    value={flags.binNumber}
                    onChange={(e) => setFlags({ ...flags, binNumber: e.target.value })}
                  />
                </div>
                <div className="mt-5 space-y-3">
                  <Checkbox
                    checked={flags.vatIncl}
                    onChange={setFlag('vatIncl')}
                    label="Product prices already include VAT"
                  />
                  <Checkbox
                    checked={flags.vatShip}
                    onChange={setFlag('vatShip')}
                    label="Charge VAT on courier delivery fees"
                  />
                </div>
              </Panel>
            )}

            {/* 6. RETURNS TAB */}
            {section === 'Returns' && (
              <Panel title="Store Return & Exchange Policy">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Return window (days after delivery)"
                    value={flags.returnWindow}
                    onChange={(e) => setFlags({ ...flags, returnWindow: e.target.value })}
                  />
                  <Select
                    label="Refund payout methods"
                    options={[
                      'Original payment or store credit',
                      'Store credit only',
                    ]}
                  />
                </div>
                <div className="mt-5 space-y-3">
                  <Checkbox
                    checked={flags.photos}
                    onChange={setFlag('photos')}
                    label="Require photos for ‘damaged’ or ‘wrong item’ return reasons"
                  />
                  <Checkbox
                    checked={flags.exchanges}
                    onChange={setFlag('exchanges')}
                    label="Allow free size exchanges inside Dhaka"
                  />
                  <Checkbox
                    checked={flags.finalSale}
                    onChange={setFlag('finalSale')}
                    label="Final sale restriction: Sarees & Jewellery (damaged only)"
                  />
                </div>
              </Panel>
            )}

            {/* 7. CUSTOMER ACCOUNTS TAB */}
            {section === 'Customer accounts' && (
              <Panel title="Customer Account Security & Authentication">
                <div className="space-y-4">
                  <Switch
                    checked={flags.social}
                    onChange={setFlag('social')}
                    label="Enable One-Click Sign in with Google & Facebook"
                  />
                  <Switch
                    checked={flags.mfa}
                    onChange={setFlag('mfa')}
                    label="Offer optional Two-Factor Authentication (2FA) for customers"
                  />
                </div>
              </Panel>
            )}

            {/* 8. PRIVACY TAB */}
            {section === 'Privacy' && (
              <Panel title="Cookie Consent & Privacy Policy">
                <Switch
                  checked={flags.cookie}
                  onChange={setFlag('cookie')}
                  label="Display GDPR & Cookie Consent banner to first-time visitors"
                />
                <p className="mt-3 text-xs text-ink-muted">
                  Analytics tracking and third-party advertising pixels will only execute after visitor consent.
                </p>
              </Panel>
            )}

            {/* 9. AVAILABILITY TAB */}
            {section === 'Availability' && (
              <Panel title="Storefront Availability & Maintenance Mode">
                <Switch
                  checked={flags.maintenance}
                  onChange={setFlag('maintenance')}
                  label="Enable Maintenance mode — show a ‘Back Soon’ countdown to visitors"
                />
                {flags.maintenance && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-semibold">Storefront is currently offline for public visitors.</p>
                    <p className="mt-1 text-xs">Logged-in staff and admins can still preview and test the store normally.</p>
                  </div>
                )}
              </Panel>
            )}

            {/* Bottom Floating Save Action Bar */}
            <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Ready to update <b>{section}</b> configuration</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => refetchTenant()}
                  className="cursor-pointer"
                >
                  Discard Changes
                </Button>
                <GuardedButton
                  module="settings"
                  action="settings"
                  size="sm"
                  loading={isSaving}
                  onClick={handleSave}
                  className="cursor-pointer bg-ink text-canvas hover:bg-ink/90 font-medium px-5"
                >
                  <Save className="h-4 w-4 mr-1.5" /> Save & Update Settings
                </GuardedButton>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </ModuleGate>
  );
}
