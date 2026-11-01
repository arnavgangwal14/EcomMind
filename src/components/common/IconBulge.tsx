import { useState, useRef, type ReactNode } from 'react'
import { cx } from '@/lib/format'

interface IconBulgeProps {
  children: ReactNode
  tooltip?: string
  className?: string
  rotate?: number
  onClick?: () => void
  ariaLabel?: string
}

/**
 * Shared Icon Bulge Component (TASK 3)
 * 
 * Features:
 * - 1.25x springy overshoot on hover & :focus-visible via cubic-bezier(0.34, 1.56, 0.64, 1)
 * - Soft violet glow / drop shadow
 * - Subtle 2-4° rotation
 * - Active press scale to 0.95x
 * - Tooltip fading and sliding in after ~250ms
 * - Touch-device tap trigger (600ms)
 * - Prefers-reduced-motion: calm 1.1x scale
 */
export function IconBulge({
  children,
  tooltip,
  className,
  rotate = 3,
  onClick,
  ariaLabel,
}: IconBulgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [touchActive, setTouchActive] = useState(false)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 220)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setShowTooltip(false)
  }

  const handleTouchStart = () => {
    setTouchActive(true)
    setShowTooltip(true)
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current)
    touchTimeoutRef.current = setTimeout(() => {
      setTouchActive(false)
      setShowTooltip(false)
    }, 600)
  }

  return (
    <div
      className={cx(
        'icon-bulge-wrapper relative inline-flex items-center justify-center select-none',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onTouchStart={handleTouchStart}
      onClick={onClick}
      tabIndex={tooltip || onClick ? 0 : undefined}
      role={ariaLabel || tooltip ? 'button' : undefined}
      aria-label={ariaLabel || tooltip}
    >
      <div
        style={{
          '--rot': `${rotate}deg`,
        } as Record<string, string>}
        className={cx(
          'icon-bulge-target relative flex items-center justify-center transition-all duration-300',
          touchActive ? 'icon-bulge-active' : '',
        )}
      >
        {children}
      </div>

      {/* Animated boundary gesture ring & ripple on hover */}
      <span className="icon-boundary-gesture" aria-hidden="true" />
      <span className="icon-boundary-ripple" aria-hidden="true" />

      {/* Accessible Tooltip */}
      {tooltip && (
        <span
          role="tooltip"
          aria-hidden={!showTooltip}
          className={cx(
            'pointer-events-none absolute -bottom-7 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#121A16] dark:bg-white px-2 py-0.5 text-[10px] font-bold text-white dark:text-[#121A16] shadow-xl transition-all duration-200',
            showTooltip
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-1 scale-95',
          )}
        >
          {tooltip}
        </span>
      )}
    </div>
  )
}

