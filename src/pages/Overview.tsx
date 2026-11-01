import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  IndianRupee, ShoppingCart, Package, Boxes, PiggyBank, Bot, Play, Pause, Activity as ActivityIcon,
  ArrowRight, Wallet, ShoppingBag, Flame,
} from 'lucide-react'
import { EcomMindLogoMark } from '@/components/brand/EcomMindLogo'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '@/store/AppContext'
import { useApiQuery } from '@/store/DataStore'
import type { ApiEvent, ApiMandate } from '@/lib/api'
import { formatNum, formatPaise, greeting, shortDate, signedDelta } from '@/lib/format'
import { RangeTabs } from '@/components/charts'
import { tooltipStyle, type DailyPoint, type Summary } from '@/lib/chartTheme'
import { BudgetProgress, ChartCard, ChartEmpty, ChartSkeleton, EmptyState, MetricCard, PanelError, StatusBadge } from '@/components/common'
import { CountUp } from '@/components/CountUp'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExploreButton } from '@/components/ExploreModal'

interface InventoryRow { sku: string; name: string; stock: number; coverageDays: number | null; status: string }
interface Recommendation { id: string; priority: 'High' | 'Medium' | 'Low'; sku: string; title: string; reason: string; impact: string; impactValue: number | null; action: string }

export default function Overview() {
  const { auth, demoLoaded, loadDemoBusiness, agentStatus, setAgentStatus, festivalEvents } = useApp()
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const navigate = useNavigate()

  const summary = useApiQuery<Summary>(`/api/analytics/summary?days=${range}`, ['analytics', 'products', 'wallet', 'agents'])
  const daily = useApiQuery<{ series: DailyPoint[] }>(`/api/analytics/daily?days=${range}`, ['analytics', 'products'])
  const inventory = useApiQuery<{ products: InventoryRow[] }>('/api/analytics/inventory', ['products'])
  const recs = useApiQuery<{ recommendations: Recommendation[] }>('/api/analytics/recommendations', ['products', 'analytics'])
  const events = useApiQuery<{ items: ApiEvent[] }>('/api/activity/events?pageSize=6', ['activity'])
  const mandate = useApiQuery<{ mandate: ApiMandate }>('/api/mandate', ['mandate'])

  const channelsQ = useApiQuery<{ marketplaces: { id: string; listings: number }[] }>('/api/marketplaces', ['orders', 'products'])
  const listedChannels = (channelsQ.data?.marketplaces ?? []).filter((m) => m.listings > 0).length
  const nextFestival = festivalEvents.find((f) => f.status !== 'Completed')
  const hasData = (summary.data?.productCount ?? 0) > 0

  if (!demoLoaded && summary.data && !hasData) {
    return (
      <EmptyState
        title="Your autonomous economy awaits"
        body="Load the demo business to explore EcomMind with 5 products, 90 days of sample sales history, supplier quotes and agent activity — or import your own data."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button className="btn-glow border-0 text-white rounded-full px-6 py-2.5 font-bold" onClick={() => loadDemoBusiness()}>
              <Play className="h-4 w-4 mr-1.5" aria-hidden /> Load Demo Business
            </Button>
            <ExploreButton />
            <Button variant="outline" className="rounded-full px-5 font-bold" onClick={() => navigate('/import')}>
              Import my data
            </Button>
          </div>
        }
      />
    )
  }

  const s = summary.data
  const loading = summary.loading
  const rev = signedDelta(s?.deltas.revenue)
  const ord = signedDelta(s?.deltas.orders)
  const prof = signedDelta(s?.deltas.profit)
  const chartData = (daily.data?.series ?? []).map((d) => ({ ...d, label: shortDate(d.date), revenueRs: d.revenue / 100 }))
  const stockData = (inventory.data?.products ?? []).map((p) => ({ ...p, short: p.name.replace('Insulated ', '').replace('Wireless ', '') }))
  const daily_ = mandate.data?.mandate.dailyBudget ?? s?.budget.daily ?? 0
  const consumed = s?.budget.consumedToday ?? 0

  return (
    <div className="space-y-8">
      {/* Editorial Semrush-Style Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="eyebrow">
              Autonomous Commerce Intelligence
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A0]" />
            <span className="text-xs font-bold text-[#3B4640]/80 dark:text-muted-foreground uppercase tracking-wider">India Sellers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#121A16] dark:text-white leading-[1.05]">
            Smarter E-Commerce. <span className="text-gradient">Stronger Business.</span>
          </h1>
          <p className="text-sm md:text-base font-medium text-[#3B4640] dark:text-muted-foreground leading-relaxed">
            {greeting()}, {auth.sellerName.split(' ')[0] || 'Seller'}. EcomMind autonomous agents are continuously discovering suppliers, evaluating RTO pincode risk, and optimizing margins across your catalogs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExploreButton />
          <RangeTabs value={range} onChange={setRange} />
          <Button variant="outline" size="sm" className="rounded-full font-bold text-xs" onClick={() => navigate('/activity')}>
            <ActivityIcon className="h-3.5 w-3.5 mr-1" aria-hidden /> View Activity
          </Button>
        </div>
      </div>

      {summary.error && <PanelError message={summary.error.message} onRetry={summary.reload} />}

      {/* 6 Key Performance Indicators in High-Elevation Semrush Cards */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard loading={loading} label="Total Revenue" value={<CountUp value={(s?.revenue ?? 0) / 100} format="inr" />} delta={rev?.text} up={rev?.up} hint={`vs prev ${range}d`} icon={<IndianRupee className="h-4 w-4" aria-hidden />} />
        <MetricCard loading={loading} label="Total Orders" value={<CountUp value={s?.orders ?? 0} />} delta={ord?.text} up={ord?.up} hint={`vs prev ${range}d`} icon={<ShoppingCart className="h-4 w-4" aria-hidden />} />
        <MetricCard loading={loading} label="Total Products" value={<CountUp value={s?.productCount ?? 0} />} hint={s?.needsAttention ? `${s.needsAttention} need attention` : 'all healthy'} icon={<Package className="h-4 w-4" aria-hidden />} />
        <MetricCard loading={loading} label="Inventory Value" value={<CountUp value={(s?.inventoryValue ?? 0) / 100} format="inr" />} hint="at unit cost" icon={<Boxes className="h-4 w-4" aria-hidden />} />
        <MetricCard loading={loading} label="Estimated Profit" value={<CountUp value={(s?.profit ?? 0) / 100} format="inr" />} delta={prof?.text} up={prof?.up} hint={`${range}d gross`} icon={<PiggyBank className="h-4 w-4" aria-hidden />} />
        <MetricCard loading={loading} label="Active AI Agents" value={<CountUp value={s?.activeAgents ?? 0} durationMs={900} />} hint={`of ${s?.agentsDiscovered ?? 0} discovered`} icon={<Bot className="h-4 w-4" aria-hidden />} />
      </div>

      {/* Frosted Frame: EcomMind Agent Command Center */}
      <div className="frosted-frame">
        <div className="card-surface p-6 md:p-8 hatch-tr overflow-hidden">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/10 p-2 shadow-lg shadow-blue-500/10 border border-[#C9D6D3]/60 dark:border-white/10">
                <EcomMindLogoMark className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-[#121A16] dark:text-white">
                    EcomMind Autonomous Core
                  </h2>
                  <StatusBadge
                    label={agentStatus === 'active' ? 'Active & Monitoring' : 'Paused'}
                    tone={agentStatus === 'active' ? 'success' : 'danger'}
                    pulse={agentStatus === 'active'}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">
                  Agent ID <span className="font-mono text-[#7B2FE0] dark:text-[#BF8FFF] font-bold">ecommind-01</span> · {s?.agentsDiscovered ?? 0} network agents synchronized across marketplaces
                </p>

                {/* Mandate & Budget Metrics */}
                <div className="mt-5 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/60 dark:bg-white/5 p-3">
                    <p className="text-[11px] font-bold text-[#3B4640]/80 dark:text-muted-foreground uppercase">Daily mandate</p>
                    <p className="tabular mt-1 text-base font-extrabold text-[#121A16] dark:text-white"><CountUp value={daily_ / 100} format="inr" /></p>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/60 dark:bg-white/5 p-3">
                    <p className="text-[11px] font-bold text-[#3B4640]/80 dark:text-muted-foreground uppercase">Consumed</p>
                    <p className="tabular mt-1 text-base font-extrabold text-[#FF9A3D]"><CountUp value={consumed / 100} format="inr" /></p>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/60 dark:bg-white/5 p-3">
                    <p className="text-[11px] font-bold text-[#3B4640]/80 dark:text-muted-foreground uppercase">Remaining</p>
                    <p className="tabular mt-1 text-base font-extrabold text-[#14B8A0]"><CountUp value={Math.max(0, daily_ - consumed) / 100} format="inr" /></p>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/60 dark:bg-white/5 p-3">
                    <p className="text-[11px] font-bold text-[#3B4640]/80 dark:text-muted-foreground uppercase">Wallet balance</p>
                    <p className="tabular mt-1 flex items-center gap-1 text-base font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">
                      <Wallet className="h-3.5 w-3.5" aria-hidden />
                      <CountUp value={(s?.walletBalance ?? 0) / 100} format="inr" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mandate Progress & Quick Actions */}
            <div className="w-full max-w-sm space-y-4">
              <BudgetProgress label="Mandate budget utilisation (today)" value={consumed / 100} max={Math.max(1, daily_ / 100)} />
              <div className="flex flex-wrap gap-2.5">
                {agentStatus === 'active' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-[#FF8A80]/40 text-[#FF8A80] hover:bg-[#FF8A80]/10 font-bold"
                    onClick={() => setAgentStatus('paused')}
                  >
                    <Pause className="h-3.5 w-3.5 mr-1" aria-hidden /> Pause Agent
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="btn-glow border-0 text-white rounded-full font-bold"
                    onClick={() => setAgentStatus('active')}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" aria-hidden /> Start EcomMind
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-full font-bold" onClick={() => navigate('/activity')}>
                  Activity Stream
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full text-[#3B4640] dark:text-muted-foreground font-bold" onClick={() => navigate('/settings')}>
                  Edit Mandate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dramatic Dark Section for Contrast (Semrush style light-bar glow) */}
      <div className="dark-section p-6 md:p-8">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md cursor-pointer transition-all hover:bg-white/10 hover:border-white/20"
            onClick={() => navigate('/selling')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#BF8FFF]/20 text-[#BF8FFF]">
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">Multi-Marketplace Selling</h3>
                    <span className="rounded-full bg-[#14B8A0]/20 px-2 py-0.5 text-[10px] font-bold text-[#14B8A0]">
                      {listedChannels} active channels
                    </span>
                  </div>
                  <p className="text-xs text-[#A3B5AE] mt-1 leading-relaxed">
                    Amazon India, Flipkart, Meesho & Shopify selling synchronously from one unified, oversell-protected inventory pool.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/50 shrink-0 ml-2" aria-hidden />
            </div>
          </div>

          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md cursor-pointer transition-all hover:bg-white/10 hover:border-white/20"
            onClick={() => navigate('/festivals')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF9A3D]/20 text-[#FF9A3D]">
                  <Flame className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">Festival Intelligence & Discounts</h3>
                    <span className="rounded-full bg-[#FF9A3D]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF9A3D]">
                      {nextFestival ? `${nextFestival.name} upcoming` : 'Diwali & Big Billion Days'}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3B5AE] mt-1 leading-relaxed">
                    AI demand surge forecasts, festive stock pre-allocation, and automated margin-safe campaign markdowns.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/50 shrink-0 ml-2" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Inventory Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <ChartCard title="Sales Analytics & Revenue Trajectory" subtitle={`Daily revenue and orders · last ${range} days`} className="xl:col-span-3">
          <div className="h-72">
            {daily.loading ? <ChartSkeleton /> : daily.error ? <PanelError message={daily.error.message} onRetry={daily.reload} />
              : chartData.length === 0 ? <ChartEmpty text="No sales recorded in this period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7B2FE0" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7B2FE0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C9D6D3" opacity={0.4} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: '#3B4640', fontSize: 11 }} />
                  <YAxis yAxisId="rev" tickLine={false} axisLine={false} tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`} width={56} tick={{ fill: '#3B4640', fontSize: 11 }} />
                  <YAxis yAxisId="ord" orientation="right" tickLine={false} axisLine={false} width={40} tick={{ fill: '#3B4640', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => (name === 'Revenue' ? [formatPaise(v * 100), name] : [formatNum(v), name])} />
                  <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenueRs" name="Revenue" stroke="#7B2FE0" strokeWidth={2.5} fill="url(#revGrad)" isAnimationActive />
                  <Area yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#14B8A0" strokeWidth={2} fill="transparent" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Inventory Cover & Stock Levels" subtitle="Stock on hand · colour denotes days of cover" className="xl:col-span-2">
          <div className="h-72">
            {inventory.loading ? <ChartSkeleton /> : inventory.error ? <PanelError message={inventory.error.message} onRetry={inventory.reload} />
              : stockData.length === 0 ? <ChartEmpty text="No products yet." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C9D6D3" opacity={0.4} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#3B4640', fontSize: 11 }} height={32} />
                  <YAxis type="category" dataKey="short" tickLine={false} axisLine={false} width={92} tick={{ fill: '#3B4640', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n, item) => [`${formatNum(v)} units · ${item.payload.coverageDays ?? '—'}d cover · ${item.payload.status}`, item.payload.name]} labelFormatter={() => ''} />
                  <Bar dataKey="stock" radius={[0, 8, 8, 0]} barSize={18}>
                    {stockData.map((d) => (
                      <Cell key={d.sku} fill={d.status === 'Critical' || d.status === 'Out of Stock' ? '#FF8A80' : d.status === 'Low Stock' ? '#FF9A3D' : '#7B2FE0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* AI Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-[#121A16] dark:text-white">AI Recommendations</h2>
            <Link to="/insights" className="flex items-center gap-1 text-xs font-bold text-[#7B2FE0] dark:text-[#BF8FFF] hover:underline">
              Open Full Intelligence Suite <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {recs.error && <PanelError message={recs.error.message} onRetry={recs.reload} />}
          {recs.data && recs.data.recommendations.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#C9D6D3] px-4 py-8 text-center text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">
              No immediate risks: stock levels, courier returns and supplier margins are currently optimal.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(recs.data?.recommendations ?? []).map((r) => (
              <Card key={r.id} className="card-surface card-hover hatch-tr">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <StatusBadge label={`${r.priority} Priority`} tone={r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'neutral'} />
                    <span className="font-mono text-[10px] font-bold text-[#3B4640]/70 dark:text-muted-foreground">{r.sku}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#121A16] dark:text-white">{r.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#3B4640] dark:text-muted-foreground">{r.reason}</p>
                  <p className="mt-2 text-xs font-bold text-[#14B8A0]">
                    {r.impactValue ? `Protects ~${formatPaise(r.impactValue)}. ` : ''}{r.impact}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#C9D6D3]/40 dark:border-white/5 pt-3">
                    <span className="line-clamp-1 text-[11px] font-medium text-[#3B4640]/80 dark:text-muted-foreground">{r.action}</span>
                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs rounded-full font-bold" onClick={() => navigate(`/inventory?q=${encodeURIComponent(r.sku)}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="card-surface xl:col-span-2 hatch-br">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#121A16] dark:text-white">Recent Agent Activity</h2>
              <StatusBadge label={agentStatus === 'active' ? 'Live Telemetry' : 'Paused'} tone={agentStatus === 'active' ? 'success' : 'danger'} pulse={agentStatus === 'active'} />
            </div>
            {events.error ? <PanelError message={events.error.message} onRetry={events.reload} /> : <ActivityTimeline events={events.data?.items ?? []} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
