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
  trendColor = 'text-emerald-600 bg-emerald-50',
  accent = 'text-slate-900',
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#132032] p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md dark:hover:shadow-slate-900/40 transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
          {label}
        </p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-black leading-none ${accent}`}>{value}</p>
      {trend && (
        <span
          className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendColor}`}
        >
          {trendUp !== undefined && (trendUp ? '↑ ' : '↓ ')}
          {trend}
        </span>
      )}
    </div>
  );
};
