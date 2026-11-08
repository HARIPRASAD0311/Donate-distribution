import React from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { SideDrawer } from './SideDrawer.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';

export function InspectorDrawer() {
  const { activeDrawer, closeDrawer } = useAppStore();

  return (
    <SideDrawer
      isOpen={activeDrawer.isOpen}
      onClose={closeDrawer}
      title={activeDrawer.type || 'Entity Details'}
      subtitle="Operational context inspector and verification ledger"
      badge={<StatusBadge variant="teal">INSPECTING</StatusBadge>}
    >
      <div className="space-y-4">
        <div className="p-3 bg-brand-bg border border-brand-border rounded-md text-xs font-mono text-text-secondary">
          <div className="font-semibold text-text-primary mb-1">INSPECTOR PAYLOAD</div>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(activeDrawer.payload || { status: 'No entity loaded' }, null, 2)}
          </pre>
        </div>
      </div>
    </SideDrawer>
  );
}
