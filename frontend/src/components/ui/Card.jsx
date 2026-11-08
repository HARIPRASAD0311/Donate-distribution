import React from 'react';

/**
 * Analytical Surface Card Container
 * Clean white surface, thin border (#DCE3E9), restrained shadow, optional header/footer.
 */
export function Card({
  title,
  subtitle,
  badge,
  action,
  children,
  footer,
  noPadding = false,
  highlight = 'none',
  className = '',
}) {
  const highlights = {
    none: '',
    critical: 'border-t-2 border-t-status-critical',
    warning: 'border-t-2 border-t-status-warning',
    teal: 'border-t-2 border-t-teal',
    navy: 'border-t-2 border-t-navy-primary',
  };

  const hasHeader = title || subtitle || action || badge;

  return (
    <div
      className={`
        bg-white border border-brand-border rounded-lg shadow-subtle flex flex-col
        ${highlights[highlight] || ''}
        ${className}
      `}
    >
      {hasHeader && (
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between gap-3 bg-white rounded-t-lg">
          <div className="flex items-center gap-2 truncate">
            {title && (
              <h3 className="text-card-title text-text-primary truncate">
                {title}
              </h3>
            )}
            {badge && <div>{badge}</div>}
            {subtitle && (
              <span className="text-xs text-text-secondary truncate hidden sm:inline">
                — {subtitle}
              </span>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`flex-1 ${noPadding ? '' : 'p-4'}`}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-2.5 bg-brand-surface-hover border-t border-brand-border-light rounded-b-lg text-xs text-text-secondary">
          {footer}
        </div>
      )}
    </div>
  );
}
