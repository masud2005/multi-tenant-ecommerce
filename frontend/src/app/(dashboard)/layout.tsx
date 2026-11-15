import React from 'react';
import type { Metadata } from 'next';
import { DashboardSidebar, DashboardNavbar } from '@/components/dashboard';
import { DashboardProvider } from '@/providers/DashboardProvider';
import { AdminGuard } from '@/components/auth/AdminGuard';

export const metadata: Metadata = {
  title: {
    template: '%s · Admin',
    default: 'Dashboard · Admin',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <DashboardProvider>
        <div className="fixed inset-0 flex h-full w-full max-w-full min-w-0 bg-canvas text-ink overflow-hidden">
          {/* Left Sidebar */}
          <DashboardSidebar />

          {/* Main Content Area */}
          <div className="flex min-w-0 flex-1 flex-col h-full max-w-full overflow-hidden">
            {/* Top Header / Navbar */}
            <DashboardNavbar />

            {/* Dynamic page content */}
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-canvas p-3 sm:p-5 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </AdminGuard>
  );
}