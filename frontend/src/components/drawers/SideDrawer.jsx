import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../ui/IconButton.jsx';

/**
 * Enterprise Slide-Over Side Drawer
 * Contextual inspector for detailed drilldowns without modal hopping.
 */
export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = 'md',
  className = '',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Surface */}
      <div
        className={`
          relative w-full ${widths[width] || widths.md} bg-white border-l border-brand-border
          shadow-drawer flex flex-col z-10 animate-in slide-in-from-right duration-200
          ${className}
        `}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-brand-border flex items-start justify-between gap-3 bg-brand-surface">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-section-title text-text-primary">
                {title}
              </h2>
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-text-secondary leading-normal">
                {subtitle}
              </p>
            )}
          </div>

          <IconButton
            icon={X}
            variant="ghost"
            size="sm"
            label="Close drawer"
            onClick={onClose}
          />
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>

        {/* Optional Drawer Footer */}
        {footer && (
          <div className="px-5 py-3.5 bg-brand-surface-hover border-t border-brand-border flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
