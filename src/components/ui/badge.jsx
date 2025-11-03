import React from 'react';
import { cn } from '../../utils';

const Badge = ({ className, variant = 'default', children, ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';

  const variants = {
    default: 'bg-blue-100 text-blue-800',
    outline: 'border border-slate-300 text-slate-700',
    secondary: 'bg-slate-100 text-slate-800',
    destructive: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

Badge.displayName = 'Badge';

export { Badge };
