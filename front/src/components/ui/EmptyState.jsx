import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Enterprise Empty State
 * Restrained informative placeholder for empty tables, search results, or queues.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active entries matching your current filters.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-brand-border rounded-lg ${className}`}>
      <div className="w-10 h-10 rounded-full bg-steel-light flex items-center justify-center text-steel mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-secondary max-w-sm mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
