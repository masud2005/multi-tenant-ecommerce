import { Metadata } from 'next';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { InventoryManager } from '@/components/dashboard/admin/inventory';

export const metadata: Metadata = {
  title: 'Inventory',
  description:
    'Real-time inventory levels, low stock tracking, reserved quantities, and movement ledger.',
};

export default function AdminInventoryPage() {
  return (
    <ModuleGate module="inventory">
      <InventoryManager />
    </ModuleGate>
  );
}
