'use client';

import React from 'react';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { DiscountsManager } from '@/components/dashboard/admin/discounts/DiscountsManager';

export default function AdminDiscountsPage() {
  return (
    <ModuleGate module="discounts">
      <DiscountsManager />
    </ModuleGate>
  );
}
