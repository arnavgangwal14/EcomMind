import { NavLink, useNavigate } from 'react-router'
import {
  LayoutDashboard, Package, BarChart3, Sparkles, Bot, Factory, Handshake, Activity,
  Wallet, ShieldCheck, Settings, Upload, ChevronsLeft, ChevronsRight, LogOut,
  ShoppingBag, Flame,
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { cx } from '@/lib/format'
import { StatusBadge } from '@/components/common'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MenuIcon } from './MenuIcon'
import { EcomMindLogoMark } from '@/components/brand/EcomMindLogo'

const NAV_SECTIONS: { label: string; items: { to: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/inventory', label: 'Inventory', icon: Package },
      { to: '/analytics', label: 'Sales Analytics', icon: BarChart3 },
      { to: '/insights', label: 'AI Insights', icon: Sparkles },
    ],
  },
  {
    label: 'Commerce & Selling',
    items: [
      { to: '/selling', label: 'Selling / Marketplaces', icon: ShoppingBag },
      { to: '/festivals', label: 'Festival Intelligence', icon: Flame },
    ],
  },
  {
    label: 'Agent Economy',
    items: [
      { to: '/agents', label: 'Agent Marketplace', icon: Bot },
      { to: '/suppliers', label: 'Supplier Marketplace', icon: Factory },
      { to: '/negotiations', label: 'Negotiations', icon: Handshake },
      { to: '/activity', label: 'Agent Activity', icon: Activity },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/wallet', label: 'Wallet & Transactions', icon: Wallet },
      { to: '/escrow', label: 'Escrow', icon: ShieldCheck },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/import', label: 'Import Data', icon: Upload },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function SidebarContent({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { auth, demoLoaded, agentStatus, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className={cx('flex h-20 items-center gap-3 border-b border-[#C9D6D3]/60 dark:border-white/10 px-4', collapsed && 'justify-center px-2')}>
        <div className="group cursor-pointer flex items-center gap-3" onClick={() => navigate('/')}>
          <div className="menu-icon-container relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/10 p-1.5 shadow-md shadow-blue-500/10 border border-[#C9D6D3]/60 dark:border-white/10 transition-transform group-hover:scale-110">
            <div className="liquid-glass-blob pointer-events-none absolute inset-0" aria-hidden />
            <EcomMindLogoMark className="menu-icon-symbol relative z-10 h-7 w-7" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-[#091B3A] dark:text-white">
                Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
              </p>
              <p className="truncate text-[9.5px] font-bold tracking-wider text-[#64748B] dark:text-muted-foreground uppercase">
                Smarter E-Commerce
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-2.5 py-4" aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-nav-section">
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-bold tracking-widest text-[#3B4640]/70 dark:text-muted-foreground/70 uppercase">
                {section.label}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const link = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group sidebar-nav-link flex items-center gap-2.5 rounded-full px-2 py-1.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#7B2FE0]',
                        collapsed && 'justify-center px-0 py-1.5 rounded-2xl',
                        isActive
                          ? 'bg-[#BF8FFF]/20 text-[#7B2FE0] dark:bg-[#7B2FE0]/25 dark:text-[#BF8FFF] shadow-xs'
                          : 'text-[#3B4640] dark:text-muted-foreground hover:bg-[#DCEDEA]/50 dark:hover:bg-white/5 hover:text-[#121A16] dark:hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <MenuIcon
                          icon={item.icon}
                          label={item.label}
                          isActive={isActive}
                          collapsed={collapsed}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.to === '/import' && !demoLoaded && (
                          <span className="ml-auto rounded-full bg-[#BF8FFF]/30 px-2 py-0.5 text-[9px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">
                            DEMO
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
                if (collapsed) {
                  return (
                    <li key={item.to}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="font-semibold bg-[#121A16] text-white border-0 shadow-xl">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  )
                }
                return <li key={item.to}>{link}</li>
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Seller Profile Bottom Card */}
      <div className="border-t border-[#C9D6D3]/60 dark:border-white/10 p-3">
        {!collapsed ? (
          <div className="rounded-2xl border border-[#C9D6D3] dark:border-white/10 bg-white/90 dark:bg-white/5 p-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-xs font-bold text-white shadow-xs">
                {(auth.sellerName || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#121A16] dark:text-white">
                  {auth.sellerName || 'Seller'}
                </p>
                <p className="truncate text-[11px] text-[#3B4640] dark:text-muted-foreground">
                  {auth.storeName || 'Store not configured'}
                </p>
              </div>
              <StatusBadge
                label={agentStatus === 'active' ? 'Live' : agentStatus === 'paused' ? 'Paused' : 'Idle'}
                tone={agentStatus === 'active' ? 'success' : agentStatus === 'paused' ? 'danger' : 'warning'}
                pulse={agentStatus === 'active'}
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#C9D6D3]/50 dark:border-white/5 pt-2.5">
              <span className="rounded-full bg-[#DCEDEA] dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#121A16] dark:text-white">
                {auth.plan}
              </span>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#3B4640] dark:text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#121A16] dark:hover:text-white"
                aria-label="Log out"
              >
                <LogOut className="h-3 w-3" aria-hidden /> Log out
              </button>
            </div>
          </div>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-xs font-bold text-white shadow-sm"
                aria-label={`${auth.sellerName} — log out`}
              >
                {(auth.sellerName || 'S').slice(0, 1).toUpperCase()}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{auth.sellerName} — click to log out</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[#C9D6D3]/70 dark:border-white/10 bg-white/80 dark:bg-[#0E1511]/90 backdrop-blur-md transition-all duration-200 lg:flex shadow-[0_10px_30px_rgba(18,26,22,0.04)]',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={onToggle}
        className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-[#C9D6D3] dark:border-white/15 bg-white dark:bg-[#0E1511] text-[#3B4640] dark:text-white shadow-md transition-all hover:scale-105 hover:border-[#7B2FE0]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  )
}
