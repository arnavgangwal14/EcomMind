import { type ImgHTMLAttributes } from 'react'
import { cx } from '@/lib/format'

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'mark' | 'full' | 'horizontal'
  showTagline?: boolean
  className?: string
  markSize?: number | string
}

/**
 * Standalone Icon Mark for EcomMind
 * (Shopping Cart + 3 Horizontal Motion Lines + 3 Financial Growth Bars + Upward Arrow)
 */
export function EcomMindLogoMark({
  className = 'h-8 w-8',
  alt = 'EcomMind Logo',
}: {
  className?: string
  alt?: string
}) {
  return (
    <img
      src="/logo-mark.png"
      alt={alt}
      className={cx('object-contain shrink-0 select-none', className)}
      loading="eager"
    />
  )
}

/**
 * Primary EcomMind Logo Component
 * Uses the official visual brand identity:
 * - Cart + Speed Lines + Growth Bars + Dynamic Arrow
 * - Ecom (Deep Navy / White) + Mind (Electric Blue)
 * - Tagline: "Smarter E-Commerce. Stronger Business."
 */
export function EcomMindLogo({
  variant = 'horizontal',
  showTagline = false,
  className,
  markSize = 36,
}: LogoProps) {
  if (variant === 'mark') {
    return (
      <EcomMindLogoMark
        className={cx('h-9 w-9', className)}
      />
    )
  }

  if (variant === 'full') {
    return (
      <div className={cx('flex flex-col items-center text-center select-none', className)}>
        {/* Logo Image in Light / Dark Modes */}
        <div className="relative">
          <img
            src="/logo.png"
            alt="EcomMind — Smarter E-Commerce. Stronger Business."
            className="h-32 sm:h-40 w-auto object-contain dark:hidden"
            loading="eager"
          />
          <img
            src="/logo-dark.png"
            alt="EcomMind — Smarter E-Commerce. Stronger Business."
            className="h-32 sm:h-40 w-auto object-contain hidden dark:block"
            loading="eager"
          />
        </div>
      </div>
    )
  }

  // Default: Horizontal Lockup
  return (
    <div className={cx('flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex items-center justify-center shrink-0">
        <EcomMindLogoMark className={typeof markSize === 'number' ? `h-[${markSize}px] w-[${markSize}px]` : markSize} />
      </div>
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-extrabold tracking-tight leading-none text-[#091B3A] dark:text-white">
          Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
        </p>
        {(showTagline || true) && (
          <p className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-[#64748B] dark:text-[#94A3B8] uppercase mt-0.5">
            Smarter E-Commerce
          </p>
        )}
      </div>
    </div>
  )
}

