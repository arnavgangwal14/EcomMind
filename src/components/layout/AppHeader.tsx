import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  Bell, Calendar, ChevronDown, Menu, Play, Search, Store, Sparkles,
  LogOut, Settings as SettingsIcon, Upload, Activity as ActivityIcon,
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { cx, timeAgo, todayLabel } from '@/lib/format'
import { useApiQuery } from '@/store/DataStore'
import type { ApiProduct, ApiServiceAgent } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarContent } from './AppSidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ExploreButton } from '@/components/ExploreModal'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Overview', '/inventory': 'Inventory', '/analytics': 'Sales Analytics', '/insights': 'AI Insights',
  '/selling': 'Selling & Marketplaces', '/festivals': 'Festival Intelligence',
  '/agents': 'Agent Marketplace', '/suppliers': 'Supplier Marketplace', '/negotiations': 'Negotiations',
  '/activity': 'Agent Activity', '/wallet': 'Wallet & Transactions', '/escrow': 'Escrow',
  '/settings': 'Settings', '/import': 'Import Data',
}

const SEARCH_PAGES = [
  { label: 'Overview', route: '/' }, { label: 'Inventory', route: '/inventory' },
  { label: 'Selling & Marketplaces', route: '/selling' }, { label: 'Festival Intelligence', route: '/festivals' },
  { label: 'Sales Analytics', route: '/analytics' }, { label: 'AI Insights', route: '/insights' },
  { label: 'Agent Marketplace', route: '/agents' }, { label: 'Supplier Marketplace', route: '/suppliers' },
  { label: 'Negotiations', route: '/negotiations' }, { label: 'Agent Activity', route: '/activity' },
  { label: 'Wallet & Transactions', route: '/wallet' }, { label: 'Escrow', route: '/escrow' },
  { label: 'Reports (in Agent Activity)', route: '/activity?tab=reports' }, { label: 'Settings', route: '/settings' },
  { label: 'Import Data', route: '/import' },
]

export function AppHeader() {
  const { agentStatus, demoLoaded, loadDemoBusiness, notifications, markNotificationsRead, auth, logout } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const store = auth.storeName || 'My store'
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const productsQ = useApiQuery<{ products: ApiProduct[] }>('/api/products', ['products'])
  const agentsQ = useApiQuery<{ agents: ApiServiceAgent[] }>('/api/service-agents', ['agents'])
  const crumbs = ROUTE_TITLES[location.pathname] ?? (location.pathname.startsWith('/negotiations') ? 'Negotiations' : 'Overview')
  const unread = notifications.filter((n) => !n.read).length

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const pages = SEARCH_PAGES.filter((p) => p.label.toLowerCase().includes(q)).map((p) => ({ kind: 'Page', label: p.label, route: p.route }))
    const products = (productsQ.data?.products ?? []).filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).map((p) => ({ kind: 'Product', label: `${p.name} · ${p.sku}`, route: `/inventory?q=${encodeURIComponent(p.sku)}` }))
    const agents = (agentsQ.data?.agents ?? []).filter((a) => a.name.toLowerCase().includes(q)).map((a) => ({ kind: 'Agent', label: a.name, route: '/agents' }))
    return [...pages, ...products, ...agents].slice(0, 8)
  }, [query, productsQ.data, agentsQ.data])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#C9D6D3]/60 dark:border-white/10 bg-white/75 dark:bg-[#0E1511]/80 px-4 md:px-8 backdrop-blur-md transition-colors">
      {/* Mobile drawer trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-[#0E1511] border-r border-[#C9D6D3] dark:border-white/10">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb title */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
        <span className="text-[#3B4640]/70 dark:text-muted-foreground">EcomMind</span>
        <span className="text-[#C9D6D3] dark:text-white/20">/</span>
        <span className="text-[#121A16] dark:text-white font-bold">{crumbs}</span>
      </div>

      {/* Global search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3B4640]/60 dark:text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search products, agents, pages…"
            className="h-10 w-full rounded-full border border-[#C9D6D3] dark:border-white/10 bg-[#F2F6F6] dark:bg-white/5 pl-9 pr-3 text-xs text-[#121A16] dark:text-white placeholder:text-[#3B4640]/60 dark:placeholder:text-muted-foreground focus:border-[#7B2FE0] focus:bg-white dark:focus:bg-[#0E1511] focus:outline-hidden focus:ring-2 focus:ring-[#7B2FE0]/20 transition-all"
            aria-label="Search products, agents and pages"
          />
        </div>
        {searchOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-[#C9D6D3] dark:border-white/10 bg-white dark:bg-[#0E1511] py-1 shadow-xl">
            {results.map((r) => (
              <button
                key={`${r.kind}-${r.label}`}
                onClick={() => {
                  navigate(r.route)
                  setSearchOpen(false)
                  setQuery('')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#121A16] dark:text-white hover:bg-[#DCEDEA]/50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="rounded-full bg-[#BF8FFF]/30 px-2 py-0.5 text-[10px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">
                  {r.kind}
                </span>
                <span className="truncate font-medium">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI status badge */}
      <div
        className={cx(
          'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold xl:flex shadow-xs',
          agentStatus === 'active'
            ? 'border-[#14B8A0]/30 bg-[#14B8A0]/10 text-[#14B8A0]'
            : agentStatus === 'paused'
            ? 'border-[#FF8A80]/30 bg-[#FF8A80]/10 text-[#FF8A80]'
            : 'border-[#FF9A3D]/30 bg-[#FF9A3D]/10 text-[#FF9A3D]',
        )}
        title={`EcomMind agent ecommind-01 is ${agentStatus}`}
      >
        <span className="relative flex h-2 w-2">
          {agentStatus === 'active' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A0] opacity-75" />}
          <span className={cx('relative inline-flex h-2 w-2 rounded-full', agentStatus === 'active' ? 'bg-[#14B8A0]' : agentStatus === 'paused' ? 'bg-[#FF8A80]' : 'bg-[#FF9A3D]')} />
        </span>
        ecommind-01 {agentStatus === 'active' ? 'online' : agentStatus}
      </div>

      {/* Explore Button (Uiverse design) */}
      <ExploreButton variant="compact" className="hidden sm:flex" />

      {/* Reload / Load demo */}
      <Button
        size="sm"
        onClick={() => loadDemoBusiness()}
        className={cx(
          'hidden sm:inline-flex rounded-full text-xs font-bold transition-all',
          demoLoaded
            ? 'border border-[#7B2FE0]/40 bg-[#7B2FE0]/10 text-[#7B2FE0] dark:text-[#BF8FFF] hover:bg-[#7B2FE0]/20'
            : 'btn-glow border-0 text-white',
        )}
      >
        {demoLoaded ? <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden /> : <Play className="h-3.5 w-3.5 mr-1" aria-hidden />}
        {demoLoaded ? 'Reload Demo' : 'Load Demo'}
      </Button>

      {/* Date */}
      <div className="hidden items-center gap-1.5 text-xs font-semibold text-[#3B4640]/70 dark:text-muted-foreground 2xl:flex">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        {todayLabel()}
      </div>

      {/* Store selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="hidden items-center gap-1.5 rounded-full border border-[#C9D6D3] dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#121A16] dark:text-white transition-all hover:border-[#7B2FE0] md:flex shadow-xs"
            aria-label="Select store"
          >
            <Store className="h-3.5 w-3.5 text-[#7B2FE0] dark:text-[#BF8FFF]" aria-hidden />
            <span className="max-w-[110px] truncate">{store}</span>
            <ChevronDown className="h-3 w-3 text-[#3B4640] dark:text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#C9D6D3] dark:border-white/10 bg-white dark:bg-[#0E1511]">
          <DropdownMenuLabel className="font-bold text-[#121A16] dark:text-white">Your store</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#14B8A0]" />
            {store}
            <span className="ml-auto text-[10px] text-muted-foreground">current</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#C9D6D3]/50 dark:bg-white/10" />
          <DropdownMenuItem onSelect={() => navigate('/settings')} className="font-medium">
            Business profile…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Switcher */}
      <ThemeToggle />

      {/* Notifications */}
      <DropdownMenu onOpenChange={(open) => { if (!open) markNotificationsRead() }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-[#3B4640] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF8A80] px-1 text-[9px] font-extrabold text-white shadow-xs">
                {unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-2xl border-[#C9D6D3] dark:border-white/10 bg-white dark:bg-[#0E1511] p-0 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#C9D6D3]/60 dark:border-white/10 px-4 py-3">
            <p className="text-xs font-bold text-[#121A16] dark:text-white">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markNotificationsRead()}
                className="text-[11px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-[#C9D6D3]/40 dark:divide-white/5">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-[#3B4640] dark:text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <div key={n.id} className={cx('p-3.5 text-xs transition-colors', !n.read && 'bg-[#BF8FFF]/10 dark:bg-white/5')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#121A16] dark:text-white">{n.title}</p>
                    <span className="text-[10px] text-[#3B4640]/70 dark:text-muted-foreground">{timeAgo(n.time)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#3B4640] dark:text-muted-foreground">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User profile avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-xs font-bold text-white shadow-xs hover:ring-2 hover:ring-[#7B2FE0]/40 hover:opacity-90 transition-all cursor-pointer focus:outline-hidden"
            aria-label="User profile menu"
          >
            {(auth.sellerName || 'A').slice(0, 1).toUpperCase()}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-[#C9D6D3] dark:border-white/10 bg-white dark:bg-[#0E1511] p-2 shadow-2xl">
          {/* User profile card matching left-most sidebar corner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F2F6F6] dark:bg-white/5 border border-[#C9D6D3]/40 dark:border-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-sm font-bold text-white shadow-xs">
              {(auth.sellerName || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#121A16] dark:text-white">
                {auth.sellerName || 'Seller'}
              </p>
              <p className="truncate text-[11px] text-[#3B4640] dark:text-muted-foreground">
                {auth.storeName || 'Store not configured'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-[#DCEDEA] dark:bg-white/10 px-1.5 py-0.5 text-[9.5px] font-bold text-[#121A16] dark:text-white">
                  {auth.plan || 'Growth Plan'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#14B8A0]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A0]" />
                  {agentStatus === 'active' ? 'Live' : 'Idle'}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-[#C9D6D3]/50 dark:bg-white/10" />

          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-[#DCEDEA]/50 dark:hover:bg-white/5"
          >
            <SettingsIcon className="h-4 w-4 text-[#7B2FE0] dark:text-[#BF8FFF]" />
            <span>Store & Mandate Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/import')}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-[#DCEDEA]/50 dark:hover:bg-white/5"
          >
            <Upload className="h-4 w-4 text-[#14B8A0]" />
            <span>Import Business Data</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/activity')}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-[#DCEDEA]/50 dark:hover:bg-white/5"
          >
            <ActivityIcon className="h-4 w-4 text-[#FF9A3D]" />
            <span>Agent Activity Telemetry</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5 bg-[#C9D6D3]/50 dark:bg-white/10" />

          <DropdownMenuItem
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
