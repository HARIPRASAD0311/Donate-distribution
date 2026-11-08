import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout.jsx';
import { CommandCenterPage } from '../features/command-center/index.js';
import { NetworkMapPage } from '../features/network-map/index.js';
import { ResourcesPage } from '../features/resources/index.js';
import { DemandPage } from '../features/demand/index.js';
import { AllocationPage } from '../features/allocation/index.js';
import { RecoveryPage } from '../features/recovery/index.js';
import { DispatchPage } from '../features/dispatch/index.js';
import { AuditPage } from '../features/audit/index.js';
import { DesignSystemShowcase } from '../features/design-system/index.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/command-center" replace />,
      },
      {
        path: 'command-center',
        element: <CommandCenterPage />,
      },
      {
        path: 'network-map',
        element: <NetworkMapPage />,
      },
      {
        path: 'resources',
        element: <ResourcesPage />,
      },
      {
        path: 'demand',
        element: <DemandPage />,
      },
      {
        path: 'allocation',
        element: <AllocationPage />,
      },
      {
        path: 'recovery',
        element: <RecoveryPage />,
      },
      {
        path: 'dispatch',
        element: <DispatchPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: 'design-system',
        element: <DesignSystemShowcase />,
      },
      {
        path: '*',
        element: (
          <div className="p-8 text-center bg-white border border-brand-border rounded-xl shadow-subtle">
            <h2 className="text-xl font-bold text-text-primary mb-2">404 — Route Not Found</h2>
            <p className="text-sm text-text-secondary mb-4">
              The requested operations module does not exist.
            </p>
            <a
              href="/command-center"
              className="inline-flex px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-md transition-colors"
            >
              Return to Command Centre
            </a>
          </div>
        ),
      },
    ],
  },
]);
