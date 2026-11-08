'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Truck, Save, Loader2, RefreshCw, MapPin } from 'lucide-react';
import { storeService } from '@/services/store-service';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { formatBDT } from '@/utils/format';

export default function AdminShippingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [shippingConfig, setShippingConfig] = useState({
    insideDhaka: 70,
    outsideDhaka: 150,
    freeDeliveryThreshold: 2500,
    insideDhakaEst: '1–2 business days',
    outsideDhakaEst: '2–4 business days',
    pickup: false,
  });

  const loadShippingSettings = async () => {
    try {
      setIsLoading(true);
      const res = await storeService.getOwnerSettings();
      if (res?.data?.settings?.shipping) {
        const sh = res.data.settings.shipping;
        setShippingConfig((prev) => ({
          ...prev,
          insideDhaka: typeof sh.insideDhaka === 'number' ? sh.insideDhaka : prev.insideDhaka,
          outsideDhaka: typeof sh.outsideDhaka === 'number' ? sh.outsideDhaka : prev.outsideDhaka,
          freeDeliveryThreshold:
            typeof sh.freeDeliveryThreshold === 'number'
              ? sh.freeDeliveryThreshold
              : typeof sh.freeShippingThreshold === 'number'
                ? sh.freeShippingThreshold
                : prev.freeDeliveryThreshold,
          insideDhakaEst: sh.insideDhakaEst || prev.insideDhakaEst,
          outsideDhakaEst: sh.outsideDhakaEst || prev.outsideDhakaEst,
          pickup: sh.pickup !== undefined ? !!sh.pickup : prev.pickup,
        }));
      }
    } catch (err: any) {
      console.warn('Could not load shipping settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShippingSettings();
  }, []);

  const handleSaveShipping = async () => {
    try {
      setIsSaving(true);
      await storeService.updateOwnerSettings({
        settings: {
          shipping: {
            insideDhaka: Number(shippingConfig.insideDhaka) || 0,
            outsideDhaka: Number(shippingConfig.outsideDhaka) || 0,
            freeDeliveryThreshold: Number(shippingConfig.freeDeliveryThreshold) || 0,
            insideDhakaEst: shippingConfig.insideDhakaEst,
            outsideDhakaEst: shippingConfig.outsideDhakaEst,
            pickup: shippingConfig.pickup,
          },
        },
      });
      toast.success('Shipping delivery charges saved successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save shipping settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleGate module="shipping">
      <div className="w-full space-y-6">
        <PageHeader
          title="Shipping & Delivery Charges"
          description="Configure dynamic delivery charges for Inside Dhaka and Outside Dhaka. Charges apply automatically during customer checkout."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadShippingSettings}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <GuardedButton
                module="shipping"
                action="update"
                size="sm"
                onClick={handleSaveShipping}
                disabled={isSaving}
                className="cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save Shipping Rates
              </GuardedButton>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Panel
              title="Regional Delivery Rates"
              description="Set flat delivery rates for Dhaka city and all other 63 districts."
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-ink">Inside Dhaka (ঢাকার মধ্যে)</p>
                    </div>
                    <Badge tone="success">Primary Zone</Badge>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Applies when customer selects Dhaka district during checkout.
                  </p>
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-medium text-ink">Delivery Charge (৳)</label>
                    <Input
                      type="number"
                      prefix="৳"
                      value={shippingConfig.insideDhaka}
                      onChange={(e) =>
                        setShippingConfig({ ...shippingConfig, insideDhaka: Number(e.target.value) })
                      }
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink">Estimated Delivery Time</label>
                    <Input
                      value={shippingConfig.insideDhakaEst}
                      onChange={(e) =>
                        setShippingConfig({ ...shippingConfig, insideDhakaEst: e.target.value })
                      }
                      placeholder="1–2 business days"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-ink">Outside Dhaka (ঢাকার বাইরে)</p>
                    </div>
                    <Badge tone="neutral">All 63 Districts</Badge>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Applies for Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh,
                    etc.
                  </p>
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-medium text-ink">Delivery Charge (৳)</label>
                    <Input
                      type="number"
                      prefix="৳"
                      value={shippingConfig.outsideDhaka}
                      onChange={(e) =>
                        setShippingConfig({
                          ...shippingConfig,
                          outsideDhaka: Number(e.target.value),
                        })
                      }
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink">Estimated Delivery Time</label>
                    <Input
                      value={shippingConfig.outsideDhakaEst}
                      onChange={(e) =>
                        setShippingConfig({ ...shippingConfig, outsideDhakaEst: e.target.value })
                      }
                      placeholder="2–4 business days"
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Free Delivery Waiver">
              <div className="space-y-3">
                <p className="text-xs text-ink-muted">
                  Offer free delivery to customers when their order subtotal exceeds this amount.
                </p>
                <div>
                  <label className="text-xs font-medium text-ink">
                    Minimum Subtotal for Free Delivery
                  </label>
                  <Input
                    type="number"
                    prefix="৳"
                    value={shippingConfig.freeDeliveryThreshold}
                    onChange={(e) =>
                      setShippingConfig({
                        ...shippingConfig,
                        freeDeliveryThreshold: Number(e.target.value),
                      })
                    }
                    placeholder="0 = disabled"
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-ink-soft">
                  Current rule: Free delivery on orders over{' '}
                  <b className="text-ink">{formatBDT(shippingConfig.freeDeliveryThreshold)}</b>.
                </p>
              </div>
            </Panel>

            <Panel title="Fulfillment Options">
              <Switch
                checked={shippingConfig.pickup}
                onChange={(v) => setShippingConfig({ ...shippingConfig, pickup: v })}
                label="Allow in-store customer pickup"
              />
              <p className="mt-2 text-xs text-ink-muted">
                When enabled, checkout shows a free Store pickup option. Returned items are
                restocked automatically when marked as received.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </ModuleGate>
  );
}
