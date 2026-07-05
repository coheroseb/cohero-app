'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  /** Main headline */
  title: string;
  /** Supporting text below the headline */
  description?: string;
  /** Lucide icon or any React node — defaults to FolderOpen */
  icon?: React.ReactNode;
  /** Optional CTA link label */
  actionLabel?: string;
  /** Optional CTA link href */
  actionHref?: string;
  /** Optional CTA click handler (alternative to href) */
  onAction?: () => void;
  /** Extra className on outer wrapper */
  className?: string;
}

/**
 * EmptyState
 * 
 * Consistent empty-state component for all lists, search results, and data views.
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={<SearchX className="w-8 h-8" />}
 *   title="Ingen resultater fundet"
 *   description="Prøv at justere din søgning."
 * />
 * ```
 */
export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-16 px-6 rounded-[var(--radius-lg)]
        bg-slate-50/60 border border-dashed border-slate-200
        ${className}
      `}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-[var(--radius-md)] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 mb-5">
        {icon ?? <FolderOpen className="w-7 h-7" />}
      </div>

      {/* Text */}
      <h3 className="text-sm font-bold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">{description}</p>
      )}

      {/* CTA */}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-[var(--radius-sm)] transition-all active:scale-95 shadow-sm"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-[var(--radius-sm)] transition-all active:scale-95 shadow-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
