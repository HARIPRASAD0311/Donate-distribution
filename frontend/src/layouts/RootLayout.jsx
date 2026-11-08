import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { AlertBanner } from './AlertBanner.jsx';
import { BackendConnectionBanner } from './BackendConnectionBanner.jsx';
import { SettingsModal } from './SettingsModal.jsx';
import { InspectorDrawer } from '../components/drawers/InspectorDrawer.jsx';
import { ErrorBoundary } from '../components/ui/ErrorBoundary.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { useLiveOperationalSync } from '../hooks/useLiveOperationalSync.js';

export function RootLayout() {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  useLiveOperationalSync();

  return (
    <div className="min-h-screen bg-brand-bg text-text-primary flex flex-col antialiased">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation with Backdrop */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar isMobile />
        </div>
      )}

      {/* Main Container Offset by Desktop Sidebar */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 min-w-0 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Compact White Global Header */}
        <Header />

        {/* Live Backend Connection Status Banner */}
        <BackendConnectionBanner />

        {/* Global Tactical Disruption Alert Banner */}
        <AlertBanner />

        {/* Main Operational Analytical Workspace */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7 bg-brand-bg">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal />

      {/* Persistent Inspection Drawer Container */}
      <InspectorDrawer />
    </div>
  );
}
