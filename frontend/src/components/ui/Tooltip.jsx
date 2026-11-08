import React, { useState } from 'react';

/**
 * Enterprise Tooltip
 * Subtle floating context label with dark navy background and restrained shadow.
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div
          role="tooltip"
          className={`
            absolute z-50 px-2 py-1 text-[11px] font-medium text-white bg-navy-primary
            rounded shadow-dropdown pointer-events-none whitespace-nowrap animate-in fade-in duration-150
            ${positions[position] || positions.top}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}
