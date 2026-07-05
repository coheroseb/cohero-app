'use client';

import React from 'react';

/* ── Base shimmer animation ─────────────────────────── */
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-100 rounded-lg ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/* ── Card skeleton ──────────────────────────────────── */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-[var(--radius-lg)] border border-slate-100 p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-[var(--radius-sm)] shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="h-3 w-1/3" />
        </div>
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-4/5" />
      <Shimmer className="h-3 w-3/5" />
    </div>
  );
}

/* ── List row skeleton ──────────────────────────────── */
export function ListRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-[var(--radius-md)] border border-slate-100 ${className}`}>
      <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="w-16 h-7 rounded-full shrink-0" />
    </div>
  );
}

/* ── Book card skeleton ─────────────────────────────── */
export function BookCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-[var(--radius-lg)] border border-slate-100 p-5 flex gap-4 ${className}`}>
      <Shimmer className="w-14 h-20 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2.5 pt-1">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="pt-2">
          <Shimmer className="h-7 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Stat card skeleton ─────────────────────────────── */
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-[var(--radius-lg)] border border-slate-100 p-6 ${className}`}>
      <Shimmer className="h-3 w-16 mb-4" />
      <Shimmer className="h-8 w-20 mb-2" />
      <Shimmer className="h-3 w-full" />
    </div>
  );
}

/* ── Notification skeleton ──────────────────────────── */
export function NotificationSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-4 p-4 ${className}`}>
      <Shimmer className="w-9 h-9 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 pt-1">
        <Shimmer className="h-3.5 w-4/5" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="w-2 h-2 rounded-full shrink-0 mt-2" />
    </div>
  );
}

/* ── Page header skeleton ───────────────────────────── */
export function PageHeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 mb-8 ${className}`}>
      <Shimmer className="w-20 h-9 rounded-full" />
      <div className="flex items-center gap-3 flex-1">
        <Shimmer className="w-11 h-11 rounded-[var(--radius-md)]" />
        <div className="space-y-2">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/* ── Generic skeleton grid ──────────────────────────── */
export function SkeletonGrid({
  count = 3,
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  variant = 'card',
  className = '',
}: {
  count?: number;
  columns?: string;
  variant?: 'card' | 'book' | 'stat' | 'row';
  className?: string;
}) {
  const items = Array.from({ length: count });
  const isRow = variant === 'row';

  return (
    <div className={`${isRow ? 'space-y-3' : `grid ${columns} gap-4`} ${className}`}>
      {items.map((_, i) => {
        if (variant === 'book') return <BookCardSkeleton key={i} />;
        if (variant === 'stat') return <StatCardSkeleton key={i} />;
        if (variant === 'row') return <ListRowSkeleton key={i} />;
        return <CardSkeleton key={i} />;
      })}
    </div>
  );
}

/* ── Default export ─────────────────────────────────── */
export { Shimmer };
export default Shimmer;
