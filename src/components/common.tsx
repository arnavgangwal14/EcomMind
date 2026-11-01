import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  TrendingUp, BarChart3, ShieldAlert, Truck, Headphones, Smartphone, Lamp, ChevronRight,
  type LucideIcon, Droplets, Dumbbell, Inbox,
} from 'lucide-react'
import { cx } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/* Icon mapper for product / agent icon keys */
const ICONS: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  chart: BarChart3,
  'shield-alert': ShieldAlert,
  truck: Truck,
  headphones: Headphones,
  smartphone: Smartphone,
  lamp: Lamp,
  bottle: Droplets,
  stretch: Dumbbell,
}

export function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Inbox
  return <Icon className={className} aria-hidden />
}

export function ProductIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#C9D6D3] dark:border-white/10 bg-[#DCEDEA]/40 dark:bg-white/5 text-[#7B2FE0] dark:text-[#BF8FFF]', className)}>
      <DynIcon name={icon} className="h-5 w-5" />
    </div>
  )
}

/* Page header with breadcrumb and Semrush typography */
export function PageHeader({ title, subtitle, crumbs, actions }: { title: string; subtitle?: string; crumbs?: string[]; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#3B4640]/70 dark:text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-[#7B2FE0] dark:hover:text-white">EcomMind</Link>
          {(crumbs ?? [title]).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-[#C9D6D3] dark:text-white/20" aria-hidden />
              <span className="text-[#121A16] dark:text-white font-medium">{c}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#121A16] dark:text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-[#3B4640] dark:text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* Metric card with Semrush styling & tabular KPI typography */
export function MetricCard({ label, value, delta, up, icon, hint, loading }: {
  label: string; value: ReactNode; delta?: string; up?: boolean; icon: ReactNode; hint?: ReactNode; loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="card-surface">
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-4 w-24 rounded-full" />
          <Skeleton className="mb-2 h-9 w-32 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="card-surface card-hover hatch-tr">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#3B4640]/80 dark:text-muted-foreground">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DCEDEA]/60 dark:bg-white/10 text-[#7B2FE0] dark:text-[#BF8FFF] shadow-xs">
            {icon}
          </div>
        </div>
        <p className="tabular mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-[#121A16] dark:text-white">
          {value}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {delta && (
            <span className={cx('inline-flex items-center gap-0.5 font-bold', up ? 'text-[#14B8A0]' : 'text-[#FF8A80]')}>
              <TrendingUp className={cx('h-3.5 w-3.5', !up && 'rotate-180')} aria-hidden />
              {delta}
            </span>
          )}
          {hint && <span className="text-[#3B4640]/70 dark:text-muted-foreground font-medium">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

/* Status badge with Semrush pill shapes & colors */
const BADGE_TONES: Record<string, string> = {
  success: 'bg-[#14B8A0]/15 text-[#0F8A77] dark:text-[#14B8A0] border-[#14B8A0]/30',
  warning: 'bg-[#FF9A3D]/15 text-[#C46A14] dark:text-[#FF9A3D] border-[#FF9A3D]/30',
  danger: 'bg-[#FF8A80]/15 text-[#D33B2E] dark:text-[#FF8A80] border-[#FF8A80]/30',
  info: 'bg-[#23A6FF]/15 text-[#0284C7] dark:text-[#23A6FF] border-[#23A6FF]/30',
  violet: 'bg-[#BF8FFF]/25 text-[#7B2FE0] dark:text-[#BF8FFF] border-[#7B2FE0]/30',
  neutral: 'bg-[#F2F6F6] dark:bg-white/10 text-[#3B4640] dark:text-muted-foreground border-[#C9D6D3] dark:border-white/10',
}

export function StatusBadge({ label, tone = 'neutral', pulse }: { label: string; tone?: keyof typeof BADGE_TONES; pulse?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-2xs', BADGE_TONES[tone])}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </span>
  )
}

export function stockTone(status: string): keyof typeof BADGE_TONES {
  switch (status) {
    case 'In Stock': return 'success'
    case 'Low Stock': return 'warning'
    case 'Critical': return 'danger'
    case 'Out of Stock': return 'danger'
    case 'Paused': return 'neutral'
    default: return 'neutral'
  }
}

/* Chart card wrapper */
export function ChartCard({ title, subtitle, action, children, className }: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <Card className={cx('card-surface hatch-tr', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-extrabold text-[#121A16] dark:text-white">{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-[#3B4640] dark:text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ChartSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-2xl bg-[#DCEDEA]/40 dark:bg-white/5" />
}

export function ChartEmpty({ text = 'No chart data available' }: { text?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[#C9D6D3] dark:border-white/10 p-6 text-center text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">
      {text}
    </div>
  )
}

/* Panel Error */
export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#FF8A80]/40 bg-[#FF8A80]/10 p-4 text-xs font-semibold text-[#FF8A80] flex items-center justify-between">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="underline hover:opacity-80 ml-2">
          Retry
        </button>
      )}
    </div>
  )
}

/* Empty State */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="frosted-frame">
      <div className="card-surface flex flex-col items-center justify-center p-12 text-center hatch-br">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-white shadow-lg mb-4">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm font-medium text-[#3B4640] dark:text-muted-foreground">{body}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}

/* Budget Progress */
export function BudgetProgress({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-[#3B4640] dark:text-muted-foreground">{label}</span>
        <span className="text-[#121A16] dark:text-white font-bold">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#DCEDEA] dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#14B8A0] via-[#23A6FF] to-[#7B2FE0] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
