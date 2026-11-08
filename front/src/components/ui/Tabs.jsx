import React from 'react';

/**
 * Enterprise Tab Navigation
 * Supports line and segmented pill variants with counts and icons.
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'line',
  className = '',
}) {
  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center p-1 bg-brand-bg border border-brand-border rounded-lg gap-1 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange?.(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all select-none
                ${isActive
                  ? 'bg-white text-navy-primary font-semibold shadow-subtle border border-brand-border/60'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold
                    ${isActive ? 'bg-teal-light text-teal' : 'bg-steel-light text-text-secondary'}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Line variant
  return (
    <div className={`border-b border-brand-border flex items-center gap-6 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.id)}
            className={`
              flex items-center gap-2 py-2.5 text-xs font-medium border-b-2 transition-all select-none -mb-px
              ${isActive
                ? 'border-teal text-teal font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-steel-light'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`
                  px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold
                  ${isActive ? 'bg-teal-light text-teal' : 'bg-steel-light text-text-secondary'}
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
