import { useState, type ComponentType, type MouseEvent } from 'react'
import { cx } from '@/lib/format'

interface MenuIconProps {
  icon: ComponentType<{ className?: string }>
  label: string
  isActive?: boolean
  className?: string
  collapsed?: boolean
}

/**
 * Reusable Liquid Glassmorphism Menu Icon Component
 * 
 * Implements:
 * 1. Fluid liquid morphing glass blob on hover & keyboard focus
 * 2. 1.2x springy scale bulge with translateY lift
 * 3. Cursor-following specular radial highlight (--mx, --my)
 * 4. Calmer persistent glass styling when active
 * 5. Full accessibility with prefers-reduced-motion & focus-visible
 */
export function MenuIcon({
  icon: Icon,
  label,
  isActive = false,
  className,
  collapsed = false,
}: MenuIconProps) {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setCoords({ x, y })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--mx': `${coords.x}%`,
        '--my': `${coords.y}%`,
      } as Record<string, string>}
      className={cx(
        'menu-icon-container relative flex h-10 w-10 shrink-0 items-center justify-center select-none',
        collapsed ? 'mx-auto' : '',
        className,
      )}
      aria-label={label}
    >
      {/* 1. Fluid Liquid Glass Blob */}
      <div
        className={cx(
          'liquid-glass-blob pointer-events-none absolute inset-0 transition-all',
          isActive ? 'liquid-glass-active' : '',
          isHovered ? 'liquid-glass-hovered' : '',
        )}
        aria-hidden
      />

      {/* 2. Cursor Specular Highlight */}
      <div className="specular-highlight pointer-events-none absolute inset-0" aria-hidden />

      {/* 3. Elevated Icon Symbol */}
      <Icon
        className={cx(
          'menu-icon-symbol relative z-10 h-4.5 w-4.5 transition-all duration-300',
          isActive
            ? 'text-[#7B2FE0] dark:text-[#BF8FFF]'
            : 'text-[#3B4640] dark:text-muted-foreground group-hover:text-[#7B2FE0] dark:group-hover:text-white',
        )}
      />
    </div>
  )
}

