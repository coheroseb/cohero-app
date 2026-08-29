'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  /** Page title text */
  title: string;
  /** Short subtitle or description */
  subtitle?: string;
  /** Lucide icon component */
  icon?: React.ReactNode;
  /** Accent color for icon background — defaults to indigo */
  iconColor?: string;
  /** Where the back button links to — defaults to /portal */
  backHref?: string;
  /** Label for back button — defaults to 'Tilbage' */
  backLabel?: string;
  /** Optional right-side actions (buttons etc.) */
  actions?: React.ReactNode;
  /** Optional extra class names on the outer wrapper */
  className?: string;
}

/**
 * PageHeader
 * 
 * Reusable, consistent header for all internal tool pages.
 * Provides: ← back link, icon + title, subtitle, and optional right-side actions.
 * 
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Case-træner"
 *   subtitle="Træn din faglige vurdering"
 *   icon={<Zap className="w-6 h-6" />}
 *   backHref="/portal"
 * />
 * ```
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  iconColor = 'bg-indigo-600 text-white',
  backHref = '/portal',
  backLabel = 'Tilbage',
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 ${className}`}
    >
      {/* Left: back link + title */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {icon && (
          <div className={`w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-[var(--radius-md)] flex items-center justify-center shadow-sm ${iconColor}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: optional actions */}
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}

      {/* Back link (rendered separately for clean layout) */}
      <Link
        href={backHref}
        className="
          order-first sm:order-none self-start
          inline-flex items-center gap-2 px-4 py-2
          text-slate-500 hover:text-slate-900
          bg-white hover:bg-slate-50
          border border-slate-100 hover:border-slate-200
          rounded-[var(--radius-sm)] shadow-sm
          label-md font-semibold
          transition-all active:scale-95
          shrink-0
        "
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
    </motion.header>
  );
}
