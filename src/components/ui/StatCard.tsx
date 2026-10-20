/**
 * ui/StatCard.tsx — ZenithRx Shared Metric Card Component
 */
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  trendColor?: string;
  accent?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendUp,
  trendColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  accent = 'text-slate-900 dark:text-white',
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#132032] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/40 transition-shadow duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-tight">
          {label}
        </p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-400 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${accent}`}>{value}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${trendColor}`}
          >
            {trendUp !== undefined && (trendUp ? '↑ ' : '↓ ')}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
