import React, { useState, useRef, useEffect } from 'react';

/**
 * Enterprise Action Dropdown Menu
 * Contextual flyout with divider support and keyboard navigation.
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-flex ${className}`} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-1 w-48 bg-white border border-brand-border rounded-lg shadow-dropdown
            py-1 z-50 animate-in fade-in zoom-in-95 duration-100
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`div-${index}`} className="my-1 border-t border-brand-border-light" />;
            }

            const Icon = item.icon;

            return (
              <button
                key={item.id || index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 transition-colors
                  ${item.destructive
                    ? 'text-status-critical hover:bg-status-critical-bg'
                    : 'text-text-primary hover:bg-brand-surface-hover hover:text-teal'
                  }
                  ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
