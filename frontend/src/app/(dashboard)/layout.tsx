import React from 'react';
import { DashboardSidebar, DashboardNavbar } from '@/components/dashboard';
import { DashboardProvider } from '@/providers/DashboardProvider';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <DashboardProvider>
        <div className="flex h-screen w-full bg-canvas text-ink overflow-hidden">
          {/* Left Sidebar */}
          <DashboardSidebar />

          {/* Main Content Area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Top Header / Navbar */}
            <DashboardNavbar />

            {/* Dynamic page content */}
            <main className="flex-1 overflow-y-auto bg-canvas p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </AdminGuard>
  );
}