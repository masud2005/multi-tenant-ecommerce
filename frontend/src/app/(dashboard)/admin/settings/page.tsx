'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Upload,
  Trash2,
  ImageIcon,
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
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isLogoRemoving, setIsLogoRemoving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 1. Store Identity Form State — no mock branding defaults
  const [storeForm, setStoreForm] = useState({
    name: '',
    tagline: '',
    logo: '',
    favicon: '',
    currency: 'BDT',
    currencySymbol: '৳',
    currencyPosition: 'prefix' as 'prefix' | 'suffix',
    timezone: '(GMT+06:00) Dhaka',
    language: 'English',
    orderNumberFormat: 'TN-{number}',
    announcement: '',
    announcementEnabled: false,
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
    cod: true,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    bkashNumber: '01700-000000',
    bkashType: 'Personal',
    bkashEnabled: true,
    nagadNumber: '01800-000000',
    nagadType: 'Personal',
    nagadEnabled: true,
    codEnabled: true,
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
            name: typeof d.name === 'string' ? d.name : '',
            tagline: typeof d.tagline === 'string' ? d.tagline : '',
            logo: typeof d.logo === 'string' ? d.logo : '',
            favicon: typeof d.favicon === 'string' ? d.favicon : '',
            currency: d.currency || prev.currency,
            currencySymbol: d.currencySymbol || prev.currencySymbol,
            currencyPosition: d.currencyPosition || prev.currencyPosition,
            orderNumberFormat:
              d.settings?.orderNumberFormat || prev.orderNumberFormat,
            announcement:
              typeof d.announcement === 'string' ? d.announcement : '',
            announcementEnabled: Boolean(d.announcementEnabled),
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

          if (d.settings?.payment) {
            setPaymentConfig((prev) => ({
              ...prev,
              ...d.settings.payment,
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
        logo: storeForm.logo,
        favicon: storeForm.favicon,
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
          payment: paymentConfig,
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

  const handleLogoUpload = async (file: File | null | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP, SVG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be under 5MB');
      return;
    }

    try {
      setIsLogoUploading(true);
      const res = await storeService.uploadOwnerLogo(file);
      const logoUrl =
        typeof res?.data?.logo === 'string' ? res.data.logo : '';
      setStoreForm((prev) => ({ ...prev, logo: logoUrl }));
      await refetchTenant();
      toast.success('Store logo uploaded — live on the storefront');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload store logo');
    } finally {
      setIsLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    try {
      setIsLogoRemoving(true);
      await storeService.removeOwnerLogo();
      setStoreForm((prev) => ({ ...prev, logo: '' }));
      await refetchTenant();
      toast.success(
        storeForm.name.trim()
          ? 'Logo removed — store name will show on the storefront'
          : 'Logo removed'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove store logo');
    } finally {
      setIsLogoRemoving(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
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
                  description="Logo and name shown in the storefront header. Logo takes priority; without a logo the store name is shown."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-sm font-medium text-ink">Store logo</p>
                      <div className="flex flex-col gap-4 rounded-lg border border-line bg-subtle/30 p-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-line-strong bg-surface">
                          {storeForm.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={storeForm.logo}
                              alt={storeForm.name || 'Store logo preview'}
                              className="max-h-16 max-w-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 px-3 text-center">
                              <ImageIcon className="h-5 w-5 text-ink-muted" aria-hidden />
                              <span className="text-[11px] text-ink-muted">
                                {storeForm.name.trim()
                                  ? 'Name will show'
                                  : 'No logo yet'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-xs text-ink-muted">
                            PNG/SVG · max 5MB · Recommended{' '}
                            <span className="font-medium text-ink">320 × 80 px</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                              className="sr-only"
                              onChange={(e) =>
                                handleLogoUpload(e.target.files?.[0])
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              loading={isLogoUploading}
                              disabled={isLogoUploading || isLogoRemoving || isLoading}
                              onClick={() => logoInputRef.current?.click()}
                              className="cursor-pointer"
                            >
                              <Upload className="h-4 w-4" aria-hidden />
                              {storeForm.logo ? 'Replace logo' : 'Upload logo'}
                            </Button>
                            {storeForm.logo ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                loading={isLogoRemoving}
                                disabled={isLogoUploading || isLogoRemoving}
                                onClick={handleLogoRemove}
                                className="cursor-pointer text-danger hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Store brand name"
                        value={storeForm.name}
                        onChange={(e) =>
                          setStoreForm({ ...storeForm, name: e.target.value })
                        }
                        placeholder="e.g. Tanti Fashion"
                        hint="Shown in the storefront header when no logo is set. Save Changes to publish name updates."
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
              <div className="space-y-6">
                <Panel
                  title="Direct Mobile Financial Services (MFS)"
                  description="Configure store numbers where customers send money directly and submit their Transaction ID (TrxID) for manual owner verification."
                >
                  <div className="space-y-6">
                    {/* bKash Configuration */}
                    <div className="rounded-lg border border-line bg-canvas p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PaymentMark method="bkash" />
                          <div>
                            <p className="text-sm font-semibold text-ink">bKash Send Money</p>
                            <p className="text-xs text-ink-muted">Customers send money to this number</p>
                          </div>
                        </div>
                        <Switch
                          checked={paymentConfig.bkashEnabled}
                          onChange={(v) =>
                            setPaymentConfig({ ...paymentConfig, bkashEnabled: v })
                          }
                          label="Enable bKash"
                          hideLabel
                        />
                      </div>
                      {paymentConfig.bkashEnabled && (
                        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
                          <Input
                            label="bKash Number"
                            value={paymentConfig.bkashNumber}
                            onChange={(e) =>
                              setPaymentConfig({
                                ...paymentConfig,
                                bkashNumber: e.target.value,
                              })
                            }
                            placeholder="01700-000000"
                          />
                          <Select
                            label="Account Type"
                            value={paymentConfig.bkashType}
                            onChange={(e) =>
                              setPaymentConfig({
                                ...paymentConfig,
                                bkashType: e.target.value,
                              })
                            }
                            options={['Personal', 'Merchant', 'Agent']}
                          />
                        </div>
                      )}
                    </div>

                    {/* Nagad Configuration */}
                    <div className="rounded-lg border border-line bg-canvas p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PaymentMark method="nagad" />
                          <div>
                            <p className="text-sm font-semibold text-ink">Nagad Send Money</p>
                            <p className="text-xs text-ink-muted">Customers send money to this number</p>
                          </div>
                        </div>
                        <Switch
                          checked={paymentConfig.nagadEnabled}
                          onChange={(v) =>
                            setPaymentConfig({ ...paymentConfig, nagadEnabled: v })
                          }
                          label="Enable Nagad"
                          hideLabel
                        />
                      </div>
                      {paymentConfig.nagadEnabled && (
                        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
                          <Input
                            label="Nagad Number"
                            value={paymentConfig.nagadNumber}
                            onChange={(e) =>
                              setPaymentConfig({
                                ...paymentConfig,
                                nagadNumber: e.target.value,
                              })
                            }
                            placeholder="01800-000000"
                          />
                          <Select
                            label="Account Type"
                            value={paymentConfig.nagadType}
                            onChange={(e) =>
                              setPaymentConfig({
                                ...paymentConfig,
                                nagadType: e.target.value,
                              })
                            }
                            options={['Personal', 'Merchant', 'Agent']}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>

                {/* Cash on Delivery Configuration */}
                <Panel
                  title="Cash on Delivery (COD)"
                  description="Allow customers across Bangladesh to pay in cash upon package delivery."
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PaymentMark method="cod" />
                      <div>
                        <p className="text-sm font-semibold text-ink">Cash on Delivery</p>
                        <p className="text-xs text-ink-muted">
                          Collected directly by the courier delivery agent
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentConfig.codEnabled}
                      onChange={(v) =>
                        setPaymentConfig({ ...paymentConfig, codEnabled: v })
                      }
                      label="Enable COD"
                      hideLabel
                    />
                  </div>
                </Panel>
              </div>
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
