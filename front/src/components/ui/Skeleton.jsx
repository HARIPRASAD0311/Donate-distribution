import React from 'react';

/**
 * Enterprise Loading Skeleton
 * Subtle shimmering placeholder adhering to strict brand tokens.
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) {
  const items = Array.from({ length: count });

  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full w-8 h-8';
      case 'kpi':
        return 'h-24 w-full rounded-lg';
      case 'table-row':
        return 'h-10 w-full rounded';
      case 'rect':
        return 'rounded-md w-full h-32';
      case 'text':
      default:
        return 'h-3.5 w-full rounded';
    }
  };

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`
            bg-slate-200/70 animate-pulse
            ${getVariantStyles()}
            ${className}
          `}
          style={{
            width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
            height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
          }}
        />
      ))}
    </>
  );
}
