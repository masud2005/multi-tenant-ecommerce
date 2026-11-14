'use client';


import { asApiError } from '@/lib/api-error';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Store,
  Save,
  CreditCard,
  RefreshCw,
  Upload,
  Trash2,
  ImageIcon,
  User,
  ShieldCheck,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  LogOut,
  Loader2,
  MapPin,
  KeyRound,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useTenant } from '@/contexts/TenantContext';
import { storeService, type UpdateStoreSettingsPayload } from '@/services/store-service';
import { authService, type AuthDeviceSession } from '@/services/auth';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'Store Profile', label: 'Store Profile', icon: Store },
  { id: 'Payments', label: 'Payments', icon: CreditCard },
  { id: 'Personal Profile', label: 'Personal Profile', icon: User },
  { id: 'Login & Security', label: 'Login & Security', icon: ShieldCheck },
] as const;

type SectionId = (typeof sections)[number]['id'];

function DeviceIcon({ type }: { type?: string }) {
  const cls = 'h-5 w-5 shrink-0 text-ink';
  switch (type) {
    case 'mobile':
      return <Smartphone className={cls} aria-hidden />;
    case 'tablet':
      return <Tablet className={cls} aria-hidden />;
    case 'desktop':
      return <Laptop className={cls} aria-hidden />;
    default:
      return <Monitor className={cls} aria-hidden />;
  }
}

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
  });

  // Payment methods — start OFF until owner settings load (avoid fake “enabled” UI)
  const [pm, setPm] = useState<Record<string, boolean>>({
    bkash: false,
    nagad: false,
    cod: true,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    bkashNumber: '',
    bkashType: 'Personal',
    bkashEnabled: false,
    nagadNumber: '',
    nagadType: 'Personal',
    nagadEnabled: false,
    codEnabled: true,
  });

  // 2. Personal Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    role: '',
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  // 3. Password Change State
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [isChangingPw, setIsChangingPw] = useState(false);

  // 4. Device Sessions State
  const [sessions, setSessions] = useState<AuthDeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [confirmOthers, setConfirmOthers] = useState(false);

        // Load existing store settings
        const loadSettings = useCallback(async () => {
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
              }));

              if (d.settings?.payment) {
                const pay = d.settings.payment;
                setPaymentConfig((prev) => ({
                  ...prev,
                  ...pay,
                  bkashEnabled:
                    typeof pay.bkashEnabled === 'boolean'
                      ? pay.bkashEnabled
                      : typeof d.settings?.pm?.bkash === 'boolean'
                        ? d.settings.pm.bkash
                        : prev.bkashEnabled,
                  nagadEnabled:
                    typeof pay.nagadEnabled === 'boolean'
                      ? pay.nagadEnabled
                      : typeof d.settings?.pm?.nagad === 'boolean'
                        ? d.settings.pm.nagad
                        : prev.nagadEnabled,
                  codEnabled:
                    typeof pay.codEnabled === 'boolean'
                      ? pay.codEnabled
                      : typeof d.settings?.pm?.cod === 'boolean'
                        ? d.settings.pm.cod
                        : prev.codEnabled,
                }));
                setPm((prev) => ({
                  ...prev,
                  bkash:
                    typeof pay.bkashEnabled === 'boolean'
                      ? pay.bkashEnabled
                      : typeof d.settings?.pm?.bkash === 'boolean'
                        ? d.settings.pm.bkash
                        : prev.bkash,
                  nagad:
                    typeof pay.nagadEnabled === 'boolean'
                      ? pay.nagadEnabled
                      : typeof d.settings?.pm?.nagad === 'boolean'
                        ? d.settings.pm.nagad
                        : prev.nagad,
                  cod:
                    typeof pay.codEnabled === 'boolean'
                      ? pay.codEnabled
                      : typeof d.settings?.pm?.cod === 'boolean'
                        ? d.settings.pm.cod
                        : prev.cod,
                }));
              } else if (d.settings?.pm) {
                const savedPm = d.settings.pm;
                setPm((prev) => ({ ...prev, ...savedPm }));
                setPaymentConfig((prev) => ({
                  ...prev,
                  bkashEnabled:
                    typeof savedPm.bkash === 'boolean' ? savedPm.bkash : prev.bkashEnabled,
                  nagadEnabled:
                    typeof savedPm.nagad === 'boolean' ? savedPm.nagad : prev.nagadEnabled,
                  codEnabled:
                    typeof savedPm.cod === 'boolean' ? savedPm.cod : prev.codEnabled,
                }));
              }
            }
          } catch (err) {
            console.error('Failed to load store settings:', err);
          } finally {
            setIsLoading(false);
          }
        }, []);

  // Load user profile
  const loadProfile = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const res = await authService.getMe();
      if (res?.data) {
        setProfileForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          district: res.data.district || '',
          role: (res.data.staffRole || res.data.role || 'Admin').toUpperCase(),
        });
        setIsProfileDirty(false);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // Load signed-in device sessions
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const list = await authService.getSessions();
      setSessions(list);
    } catch {
      toast.error('Could not load signed-in devices');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (section === 'Personal Profile') {
      loadProfile();
    } else if (section === 'Login & Security') {
      loadSessions();
    }
  }, [section, loadProfile, loadSessions]);

  // Save changes handler with rich feedback
  const handleSave = async () => {
    try {
      setIsSaving(true);

              const payload: UpdateStoreSettingsPayload = {
                name: storeForm.name || undefined,
                tagline: storeForm.tagline || undefined,
                logo: storeForm.logo || undefined,
                favicon: storeForm.favicon || undefined,
                settings: {
                  pm: {
                    bkash: !!paymentConfig.bkashEnabled,
                    nagad: !!paymentConfig.nagadEnabled,
                    cod: !!paymentConfig.codEnabled,
                  },
                  payment: {
                    bkashNumber: paymentConfig.bkashNumber || '',
                    bkashType: paymentConfig.bkashType || 'Personal',
                    bkashEnabled: !!paymentConfig.bkashEnabled,
                    nagadNumber: paymentConfig.nagadNumber || '',
                    nagadType: paymentConfig.nagadType || 'Personal',
                    nagadEnabled: !!paymentConfig.nagadEnabled,
                    codEnabled: !!paymentConfig.codEnabled,
                  },
                },
              };

              const res = await storeService.updateOwnerSettings(payload);
              const savedPayment = res?.data?.settings?.payment;
              if(section === 'Payments' && !savedPayment) {
                throw new Error('Payment settings were not saved. Please try again.');
        }
              await refetchTenant();
        toast.success(`${section} settings saved & published successfully!`);
      } catch (err: unknown) {
        console.error('Settings save failed:', err);
        toast.error(asApiError(err).message || 'Failed to save settings');
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
      } catch (err: unknown) {
        toast.error(asApiError(err).message || 'Failed to upload store logo');
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
      } catch (err: unknown) {
        toast.error(asApiError(err).message || 'Failed to remove store logo');
      } finally {
        setIsLogoRemoving(false);
        if (logoInputRef.current) logoInputRef.current.value = '';
      }
    };

    const handleSaveProfile = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!profileForm.name.trim()) {
        toast.error('Name cannot be empty');
        return;
      }
      try {
        setIsSavingProfile(true);
        const res = await authService.updateProfile({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          district: profileForm.district.trim() || undefined,
        });
        if (res?.data) {
          setProfileForm((prev) => ({
            ...prev,
            name: res.data.name || prev.name,
            phone: res.data.phone || prev.phone,
            district: res.data.district ?? prev.district,
          }));
          setIsProfileDirty(false);
          toast.success('Personal profile updated successfully!');
        }
      } catch (err: unknown) {
        toast.error(asApiError(err).message || 'Failed to update personal profile');
      } finally {
        setIsSavingProfile(false);
      }
    };

    const handleSavePassword = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const er: Record<string, string> = {};
      if (!pw.current) er.current = 'Enter your current password';
      if (pw.next.length < 6) er.next = 'Use at least 6 characters';
      if (pw.next !== pw.confirm) er.confirm = 'Passwords don’t match';
      setPwErrors(er);
      if (Object.keys(er).length) return;

      try {
        setIsChangingPw(true);
        await authService.changePassword({
          oldPassword: pw.current,
          newPassword: pw.next,
        });
        setPw({ current: '', next: '', confirm: '' });
        setPwErrors({});
        toast.success('Password updated successfully!');
      } catch (err: unknown) {
        toast.error(
          asApiError(err).message ||
          'Could not change password. Check your current password and try again.'
        );
      } finally {
        setIsChangingPw(false);
      }
    };

    const handleRevoke = async (session: AuthDeviceSession) => {
      setRevokingId(session.id);
      try {
        const res = await authService.revokeSession(session.id);
        if (res?.signedOutCurrent || session.isCurrent) {
          toast.success('Signed out of this device');
          await authService.logout();
          window.location.href = '/login';
          return;
        }
        toast.success('Device signed out');
        await loadSessions();
      } catch (err: unknown) {
        toast.error(asApiError(err).message || 'Could not sign out that device');
      } finally {
        setRevokingId(null);
      }
    };

    const handleRevokeOthers = async () => {
      setRevokingOthers(true);
      try {
        const res = await authService.revokeOtherSessions();
        toast.success(
          res?.revokedCount
            ? `Signed out of ${res.revokedCount} other device${res.revokedCount === 1 ? '' : 's'}`
            : 'No other devices were signed in'
        );
        setConfirmOthers(false);
        await loadSessions();
      } catch (err: unknown) {
        toast.error(asApiError(err).message || 'Could not sign out other devices');
      } finally {
        setRevokingOthers(false);
      }
    };

    const otherCount = sessions.filter((s) => !s.isCurrent).length;

    const handleTopSave = async () => {
      if (section === 'Store Profile' || section === 'Payments') {
        await handleSave();
      } else if (section === 'Personal Profile') {
        await handleSaveProfile();
      } else if (section === 'Login & Security') {
        if (pw.current || pw.next || pw.confirm) {
          await handleSavePassword();
        } else {
          toast.info('Please enter your current and new password to update.');
        }
      }
    };

    const handleTopRefresh = async () => {
      if (section === 'Store Profile' || section === 'Payments') {
        await Promise.all([loadSettings(), refetchTenant()]);
        toast.success('Store settings refreshed');
      } else if (section === 'Personal Profile') {
        await loadProfile();
        toast.success('Personal profile refreshed');
      } else if (section === 'Login & Security') {
        await loadSessions();
        toast.success('Device sessions refreshed');
      }
    };

    return (
      <ModuleGate module="settings">
        <div className="w-full space-y-6 pb-12">
          {/* Top Header */}
          <PageHeader
            title="Store Settings & Configuration"
            description="Manage store branding, payments, and personal account security."
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTopRefresh}
                  className="cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
                </Button>
                <Button
                  size="sm"
                  loading={isSaving || isSavingProfile || isChangingPw}
                  onClick={handleTopSave}
                  className="cursor-pointer bg-ink text-canvas hover:bg-ink/90 font-medium px-4"
                >
                  <Save className="h-4 w-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            }
          />

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
            <div className="space-y-6">
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
                </div>
              )}

              {/* PAYMENTS TAB */}
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
                            onChange={(v) => {
                              setPaymentConfig({ ...paymentConfig, bkashEnabled: v });
                              setPm((prev) => ({ ...prev, bkash: v }));
                            }}
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
                            onChange={(v) => {
                              setPaymentConfig({ ...paymentConfig, nagadEnabled: v });
                              setPm((prev) => ({ ...prev, nagad: v }));
                            }}
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
                        onChange={(v) => {
                          setPaymentConfig({ ...paymentConfig, codEnabled: v });
                          setPm((prev) => ({ ...prev, cod: v }));
                        }}
                        label="Enable COD"
                        hideLabel
                      />
                    </div>
                  </Panel>
                </div>
              )}

              {/* 3. PERSONAL PROFILE TAB */}
              {section === 'Personal Profile' && (
                <div className="space-y-6">
                  <Panel
                    title="Personal Profile"
                    description="Update your personal account details, contact number, and district."
                  >
                    {isProfileLoading ? (
                      <div className="flex items-center gap-2 py-8 text-sm text-ink-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading profile…</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="flex items-center gap-4 p-4 rounded-lg border border-line bg-subtle/30">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-canvas font-semibold text-lg">
                            {profileForm.name ? profileForm.name.slice(0, 2).toUpperCase() : 'ME'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-ink text-base">
                                {profileForm.name || 'Admin User'}
                              </p>
                              {profileForm.role && (
                                <Badge tone="neutral" className="uppercase text-[10px]">
                                  {profileForm.role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5">{profileForm.email}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Input
                              label="Full name"
                              placeholder="e.g. Masud Rana"
                              value={profileForm.name}
                              onChange={(e) => {
                                setProfileForm({ ...profileForm, name: e.target.value });
                                setIsProfileDirty(true);
                              }}
                              autoComplete="name"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Input
                              label="Email address"
                              type="email"
                              value={profileForm.email}
                              disabled
                              hint="Email is used to sign in and cannot be changed here."
                              autoComplete="email"
                            />
                          </div>
                          <div>
                            <Input
                              label="Mobile number"
                              placeholder="01XXXXXXXXX"
                              value={profileForm.phone}
                              onChange={(e) => {
                                setProfileForm({ ...profileForm, phone: e.target.value });
                                setIsProfileDirty(true);
                              }}
                              autoComplete="tel"
                            />
                          </div>
                          <div>
                            <Input
                              label="District / City"
                              placeholder="e.g. Dhaka"
                              value={profileForm.district}
                              onChange={(e) => {
                                setProfileForm({ ...profileForm, district: e.target.value });
                                setIsProfileDirty(true);
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-line">
                          <Button
                            type="submit"
                            loading={isSavingProfile}
                            disabled={!isProfileDirty && !isSavingProfile}
                            className="bg-ink text-canvas hover:bg-ink/90 cursor-pointer"
                          >
                            <Save className="h-4 w-4 mr-1.5" /> Save Profile
                          </Button>
                        </div>
                      </form>
                    )}
                  </Panel>
                </div>
              )}

              {/* 4. LOGIN & SECURITY TAB */}
              {section === 'Login & Security' && (
                <div className="space-y-6">
                  {/* Change Password Panel */}
                  <Panel
                    title="Change Password"
                    description="Ensure your account is using a long, random password to stay secure."
                  >
                    <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
                      <Input
                        label="Current password"
                        type="password"
                        placeholder="Enter your current password"
                        value={pw.current}
                        onChange={(e) => setPw({ ...pw, current: e.target.value })}
                        error={pwErrors.current}
                        autoComplete="current-password"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="New password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={pw.next}
                          onChange={(e) => setPw({ ...pw, next: e.target.value })}
                          error={pwErrors.next}
                          autoComplete="new-password"
                        />
                        <Input
                          label="Confirm new password"
                          type="password"
                          placeholder="Re-enter new password"
                          value={pw.confirm}
                          onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                          error={pwErrors.confirm}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="pt-2">
                        <Button
                          type="submit"
                          loading={isChangingPw}
                          className="bg-ink text-canvas hover:bg-ink/90 cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4 mr-1.5" /> Update Password
                        </Button>
                      </div>
                    </form>
                  </Panel>

                  {/* Signed-in Devices Panel */}
                  <Panel
                    title="Signed-in Devices"
                    description="Devices currently authenticated into your account. Sign out of any devices you do not recognize."
                    actions={
                      otherCount > 0 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmOthers(true)}
                          className="cursor-pointer text-xs"
                        >
                          Sign out others
                        </Button>
                      ) : undefined
                    }
                  >
                    <div className="divide-y divide-line">
                      {sessionsLoading ? (
                        <div className="flex items-center gap-2 py-8 text-sm text-ink-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading active sessions…</span>
                        </div>
                      ) : sessions.length === 0 ? (
                        <p className="py-6 text-sm text-ink-muted">
                          No active sessions found. Sign in again to view your current session here.
                        </p>
                      ) : (
                        sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle">
                                <DeviceIcon type={session.deviceType} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-ink">
                                    {session.deviceLabel}
                                  </p>
                                  {session.isCurrent && (
                                    <Badge tone="success" dot>This device</Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                  Last active {formatDateTime(session.lastActiveAt)}
                                  {session.createdAt ? ` · Signed in ${formatDateTime(session.createdAt)}` : ''}
                                </p>
                                {session.ipAddress && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
                                    <MapPin className="h-3 w-3" aria-hidden />
                                    {session.ipAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-ink-muted hover:text-danger hover:bg-danger/10 cursor-pointer"
                              loading={revokingId === session.id}
                              onClick={() => handleRevoke(session)}
                            >
                              <LogOut className="mr-1.5 h-3.5 w-3.5" />
                              {session.isCurrent ? 'Sign out' : 'Remove'}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </Panel>
                </div>
              )}
            </div>
          </div>
        </div >

        {/* Sign out others Confirmation Modal */}
        < Modal
          open={confirmOthers}
          onClose={() => setConfirmOthers(false)
          }
          title="Sign out other devices?"
          description="You will stay signed in on this device. All other signed-in sessions will be invalidated immediately."
          size="sm"
          footer={
            < div className="flex items-center justify-end gap-2 w-full" >
              <Button variant="ghost" onClick={() => setConfirmOthers(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={revokingOthers}
                onClick={handleRevokeOthers}
                className="cursor-pointer"
              >
                Sign out others
              </Button>
            </div >
          }
        />
      </ModuleGate >
    );
  }
