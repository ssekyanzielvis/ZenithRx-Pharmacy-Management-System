/**
 * ui/Badge.tsx — ZenithRx Shared Status Badge Component
 */
import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'amber'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  danger:  'bg-red-100 text-red-800 border border-red-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  info:    'bg-sky-100 text-sky-800 border border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  amber:   'bg-orange-100 text-orange-800 border border-orange-200',
  purple:  'bg-purple-100 text-purple-800 border border-purple-200',
};

const sizeStyles = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
