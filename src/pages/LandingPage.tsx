import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, Bot, Check, ChevronDown,
  Factory, Flame, Handshake, Play, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, Truck,
} from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { formatNum } from '@/lib/format'
import { ExploreButton, CinematicLogoIntro, LiveTelemetryShowcase } from '@/components/ExploreModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { EcomMindLogoMark } from '@/components/brand/EcomMindLogo'
import { IconBulge } from '@/components/common/IconBulge'

export default function LandingPage() {
  const navigate = useNavigate()
  const { demoLogin } = useApp()
  const [demoLoading, setDemoLoading] = useState(false)

  // Interactive Margin Calculator state
  const [sellingPrice, setSellingPrice] = useState(1299)
  const [productCost, setProductCost] = useState(480)
  const [platformFeePct, setPlatformFeePct] = useState(15) // 15% marketplace commission
  const [shippingFee, setShippingFee] = useState(85)
  const expectedRtoPct = 12 // 12% return rate

  // Interactive ROI Calculator state
  const [monthlyOrders, setMonthlyOrders] = useState(2500)
  const [aov, setAov] = useState(1400)

  // Interactive Negotiation Simulation state
  const [negotiationStep, setNegotiationStep] = useState(3)

  // FAQ open/close state
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Calculated margin breakdown
  const commissionRupees = Math.round((sellingPrice * platformFeePct) / 100)
  const rtoLossPerUnit = Math.round((shippingFee * 1.8 * expectedRtoPct) / 100)
  const netPocketProfit = Math.max(0, sellingPrice - productCost - commissionRupees - shippingFee - rtoLossPerUnit)
  const netMarginPct = Math.round((netPocketProfit / sellingPrice) * 100)

  // Calculated ROI
  const monthlyGmv = monthlyOrders * aov
  const estimatedSupplierSavings = Math.round(monthlyGmv * 0.08) // 8% saved via autonomous negotiation
  const estimatedRtoSavings = Math.round(monthlyOrders * 0.12 * 140 * 0.42) // 42% of RTOs blocked
  const totalMonthlyBenefit = estimatedSupplierSavings + estimatedRtoSavings
  const annualBenefitLakhs = ((totalMonthlyBenefit * 12) / 100000).toFixed(1)

  const handleLaunchDemo = async () => {
    setDemoLoading(true)
    try {
      await demoLogin()
      navigate('/')
    } catch {
      navigate('/login')
    } finally {
      setDemoLoading(false)
    }
  }

  // Scroll Progress Tracking & IntersectionObserver for below-the-fold reveals (TASK 2)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const elements = document.querySelectorAll('.scroll-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DDEEEB] via-[#E2EAF1] to-[#E6E6F6] text-[#121A16] dark:from-[#060B08] dark:to-[#0A0F0D] dark:text-[#F2F6F6] font-sans selection:bg-[#BF8FFF]/40">
      
      {/* Thin Scroll Progress Bar (TASK 2) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#23A6FF] via-[#7B2FE0] to-[#14B8A0] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* 1. Top 44px Announcement Bar */}
      <aside
        aria-label="Announcement"
        className="relative z-50 flex h-11 w-full items-center justify-between bg-[#BF8FFF] px-4 text-[#121A16] shadow-xs"
      >
        <div className="mx-auto flex items-center gap-2 text-xs sm:text-[13px] font-medium tracking-tight">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#121A16] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
            <IconBulge tooltip="What's New">
              <Sparkles className="h-3 w-3 text-[#BF8FFF]" />
            </IconBulge>
            New
          </span>
          <span>
            <strong className="font-extrabold uppercase tracking-wide">Try EcomMind Free</strong> — Autonomous AI agents for Indian e-commerce sellers
          </span>
          <button
            onClick={() => navigate('/register')}
            className="hidden md:inline-flex items-center gap-0.5 font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Create Account Free <IconBulge tooltip="Create Free Account"><ArrowUpRight className="h-3.5 w-3.5" /></IconBulge>
          </button>
        </div>
      </aside>

      {/* 2. Floating Frosted Sticky Navigation Bar */}
      <header className="sticky top-4 z-40 px-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-[#C9D6D3] dark:border-white/10 bg-white/80 dark:bg-[#0E1511]/85 px-4 sm:px-6 py-2.5 shadow-[0_12px_40px_rgba(18,26,22,0.06)] backdrop-blur-md icon-bulge-group">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-white/10 p-1 shadow-sm border border-[#C9D6D3]/60 dark:border-white/10">
              <IconBulge tooltip="EcomMind Home">
                <EcomMindLogoMark className="h-7 w-7" />
              </IconBulge>
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-[#091B3A] dark:text-white">
                Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
              </p>
              <p className="text-[9px] font-bold tracking-widest text-[#64748B] dark:text-muted-foreground uppercase hidden sm:block">
                Smarter E-Commerce
              </p>
            </div>
          </Link>

          {/* Center Navigation Anchors */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-[#3B4640] dark:text-muted-foreground">
            <a href="#explore-showcase" className="text-[#7B2FE0] dark:text-[#BF8FFF] text-bulge flex items-center gap-1 font-extrabold">
              <IconBulge tooltip="Direct Live Interface">
                <Sparkles className="h-3.5 w-3.5" />
              </IconBulge>
              Explore Direct
            </a>
            <a href="#how-it-works" className="text-bulge hover:text-[#7B2FE0] dark:hover:text-white transition-colors">How It Works</a>
            <a href="#margin-engine" className="text-bulge hover:text-[#7B2FE0] dark:hover:text-white transition-colors">Margin Engine</a>
            <a href="#supplier-negotiation" className="text-bulge hover:text-[#7B2FE0] dark:hover:text-white transition-colors">AI Supplier Deals</a>
            <a href="#rto-intelligence" className="text-bulge hover:text-[#7B2FE0] dark:hover:text-white transition-colors">RTO Defense</a>
            <a href="#roi-calculator" className="text-bulge hover:text-[#7B2FE0] dark:hover:text-white transition-colors">ROI Calculator</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <IconBulge tooltip="Toggle Dark/Light Mode">
              <ThemeToggle />
            </IconBulge>
            <a
              href="#explore-showcase"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#7B2FE0]/30 bg-[#BF8FFF]/15 dark:bg-[#7B2FE0]/25 px-3.5 py-1.5 text-xs font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF] hover:bg-[#BF8FFF]/30 transition-colors"
            >
              <IconBulge tooltip="Continuous Graph">
                <Sparkles className="h-3.5 w-3.5" />
              </IconBulge>
              Live Graph
            </a>
            <ExploreButton variant="compact" />
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-xs font-bold text-[#121A16] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-glow rounded-full px-4 sm:px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Editorial Semrush Aesthetic) */}
      <section className="relative px-4 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-5xl text-center">
          
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#C9D6D3] dark:border-white/15 bg-white/80 dark:bg-white/5 px-4 py-1.5 text-xs font-bold shadow-xs mb-6"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A0]" />
            </span>
            <span className="text-[#7B2FE0] dark:text-[#BF8FFF] uppercase tracking-wider font-extrabold text-[11px]">
              FINTECH & E-COMMERCE AUTONOMOUS INTELLIGENCE
            </span>
            <span className="text-[#3B4640]/40">·</span>
            <span className="text-[#3B4640] dark:text-muted-foreground text-[11px]">BUILT FOR INDIA SELLERS</span>
          </motion.div>

          {/* Main Headline with tight tracking */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="heading-bulge text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#121A16] dark:text-white leading-[1.0] max-w-4xl mx-auto"
          >
            From E-commerce to <br />
            <span className="text-gradient">Business Intelligence.</span>
          </motion.h1>

          {/* Official Tagline & Value Proposition */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl font-medium text-[#3B4640] dark:text-[#A3B5AE] max-w-2xl mx-auto leading-relaxed"
          >
            <strong className="text-bulge text-[#121A16] dark:text-white">Smarter E-Commerce. Stronger Business.</strong><br />
            Autonomous AI agents that audit SKU profit margins, negotiate restock pricing with suppliers, and block high-return pincodes across Amazon, Flipkart, Meesho & Shopify.
          </motion.p>

          {/* CTA Cluster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 icon-bulge-group"
          >
            <Link
              to="/register"
              className="btn-glow flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold text-white shadow-xl hover:scale-105 transition-transform"
            >
              Start Free Trial
              <IconBulge tooltip="Start Free Trial">
                <ArrowRight className="h-4 w-4" />
              </IconBulge>
            </Link>

            <a
              href="#explore-showcase"
              className="flex items-center gap-2 rounded-full border border-[#7B2FE0]/40 bg-white/90 dark:bg-[#0E1511] px-6 py-3.5 text-sm font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF] shadow-md hover:border-[#7B2FE0] hover:bg-[#DCEDEA]/40 transition-all"
            >
              <IconBulge tooltip="Scroll to Live Explorer">
                <Sparkles className="h-4 w-4 text-[#7B2FE0] dark:text-[#BF8FFF]" />
              </IconBulge>
              Explore Direct On Page ↓
            </a>

            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="flex items-center gap-2 rounded-full border border-[#C9D6D3] dark:border-white/15 bg-white/90 dark:bg-[#0E1511] px-6 py-3 text-sm font-extrabold text-[#121A16] dark:text-white shadow-sm hover:border-[#7B2FE0] hover:bg-[#DCEDEA]/40 transition-all"
            >
              <IconBulge tooltip="Try Interactive Demo">
                <Play className="h-4 w-4 text-[#7B2FE0] dark:text-[#BF8FFF]" />
              </IconBulge>
              {demoLoading ? 'Launching Demo…' : 'Try 1-Click Interactive Demo'}
            </button>
          </motion.div>

          {/* Reassurance pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#3B4640]/80 dark:text-muted-foreground icon-bulge-group">
            <span className="flex items-center gap-1.5">
              <IconBulge tooltip="No credit card required">
                <Check className="h-4 w-4 text-[#14B8A0]" />
              </IconBulge>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <IconBulge tooltip="Valid Indian GSTINs">
                <Check className="h-4 w-4 text-[#14B8A0]" />
              </IconBulge>
              Valid for all Indian GSTINs
            </span>
            <span className="flex items-center gap-1.5">
              <IconBulge tooltip="5-min CSV/Excel Setup">
                <Check className="h-4 w-4 text-[#14B8A0]" />
              </IconBulge>
              5-minute setup with CSV/Excel
            </span>
          </div>

          {/* HERO INTERACTIVE MOCKUP WITH FROSTED FRAME & SCATTERED FLOATING BADGES */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 relative"
          >
            {/* Floating Live Badges */}
            <div className="hidden lg:block absolute -top-6 -left-6 z-20 animate-bounce">
              <div className="rounded-2xl border border-[#C9D6D3] bg-white dark:bg-[#0E1511] px-4 py-2.5 shadow-xl flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-[#14B8A0]" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#3B4640]/70 uppercase">Negotiation Won</p>
                  <p className="text-xs font-extrabold text-[#14B8A0]">Saved ₹4,500 on 300 Units</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -bottom-6 -right-6 z-20 animate-pulse">
              <div className="rounded-2xl border border-[#FF8A80]/40 bg-white dark:bg-[#0E1511] px-4 py-2.5 shadow-xl flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#FF8A80]" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[#3B4640]/70 uppercase">RTO Defense Alert</p>
                  <p className="text-xs font-extrabold text-[#FF8A80]">Pincode 110006 Flagged (38% Return)</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute -top-8 right-12 z-20">
              <div className="rounded-full border border-[#7B2FE0]/30 bg-[#BF8FFF]/20 dark:bg-[#7B2FE0]/30 px-3 py-1 shadow-md text-[11px] font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">
                ⚡ 4 Marketplaces Live-Synced
              </div>
            </div>

            {/* Frosted Frame Container */}
            <div className="frosted-frame max-w-4xl mx-auto">
              <div className="card-surface p-6 sm:p-8 hatch-tr overflow-hidden text-left">
                
                {/* Mock Dashboard Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C9D6D3]/60 dark:border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-white/10 p-1 shadow-sm border border-[#C9D6D3]/60 dark:border-white/10">
                      <EcomMindLogoMark className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#121A16] dark:text-white">ecommind-01 Core Autonomous Engine</h3>
                        <span className="rounded-full bg-[#14B8A0]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#14B8A0]">
                          Live Telemetry
                        </span>
                      </div>
                      <p className="text-xs text-[#3B4640] dark:text-muted-foreground">
                        Simulated execution · Connected to Amazon India, Flipkart & Delhivery
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#DCEDEA] dark:bg-white/10 px-3 py-1 text-xs font-bold text-[#121A16] dark:text-white">
                      Daily Mandate: ₹50,000
                    </span>
                  </div>
                </div>

                {/* Mock Metric Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/70 dark:bg-white/5 p-3.5">
                    <p className="text-[11px] font-bold text-[#3B4640]/70 dark:text-muted-foreground uppercase">Protected GMV</p>
                    <p className="mt-1 text-lg font-extrabold text-[#121A16] dark:text-white">₹ 14,82,400</p>
                    <span className="text-[10px] font-bold text-[#14B8A0]">+24.5% vs last month</span>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/70 dark:bg-white/5 p-3.5">
                    <p className="text-[11px] font-bold text-[#3B4640]/70 dark:text-muted-foreground uppercase">Gross Margin</p>
                    <p className="mt-1 text-lg font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">34.2%</p>
                    <span className="text-[10px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">Auto-repricing active</span>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/70 dark:bg-white/5 p-3.5">
                    <p className="text-[11px] font-bold text-[#3B4640]/70 dark:text-muted-foreground uppercase">Supplier Savings</p>
                    <p className="mt-1 text-lg font-extrabold text-[#14B8A0]">₹ 68,400</p>
                    <span className="text-[10px] font-bold text-[#14B8A0]">Reclaimed from MOQ bids</span>
                  </div>
                  <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/70 dark:bg-white/5 p-3.5">
                    <p className="text-[11px] font-bold text-[#3B4640]/70 dark:text-muted-foreground uppercase">RTO Blocked</p>
                    <p className="mt-1 text-lg font-extrabold text-[#FF9A3D]">142 Orders</p>
                    <span className="text-[10px] font-bold text-[#FF9A3D]">Saved ₹28,400 in freight</span>
                  </div>
                </div>

                {/* Live Action Stream Preview */}
                <div className="mt-5 rounded-2xl border border-[#C9D6D3]/60 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4">
                  <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#121A16] dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#7B2FE0]" />
                      Recent Autonomous Agent Actions
                    </span>
                    <span className="text-[10px] text-[#3B4640]/70 dark:text-muted-foreground font-mono">Live Sync</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-[#14B8A0]/10 p-2 text-[#0F8A77] dark:text-[#14B8A0] font-semibold">
                      <span>✓ Supplier B accepted counter-offer of ₹180/unit (was ₹195) for SKU-LED-005</span>
                      <span className="font-mono text-[10px]">Just now</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#FF9A3D]/10 p-2 text-[#C46A14] dark:text-[#FF9A3D] font-semibold">
                      <span>⚡ Repriced Wireless Headphones on Amazon from ₹1,499 to ₹1,549 to protect 32% margin</span>
                      <span className="font-mono text-[10px]">3m ago</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[#23A6FF]/10 p-2 text-[#0284C7] dark:text-[#23A6FF] font-semibold">
                      <span>📦 48 Units allocated for Diwali festival surge across Mumbai & Bengaluru hubs</span>
                      <span className="font-mono text-[10px]">12m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3.5 DIRECT ON-PAGE EXPLORE INTERFACE & LIVE SELF-GENERATING GRAPH */}
      <section
        id="explore-showcase"
        className="scroll-reveal relative px-4 py-16 md:py-24 border-y border-[#C9D6D3]/60 dark:border-white/10 bg-gradient-to-b from-white/40 via-[#DCEDEA]/30 to-white/40 dark:from-white/[0.02] dark:via-white/[0.04] dark:to-transparent"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7B2FE0]/30 bg-[#BF8FFF]/15 dark:bg-[#7B2FE0]/25 px-4 py-1.5 text-xs font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF] mb-3">
              <IconBulge tooltip="Autonomous Engine">
                <Sparkles className="h-3.5 w-3.5" />
              </IconBulge>
              <span>LIVE AUTONOMOUS ENGINE · DIRECT ON PAGE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#121A16] dark:text-white">
              From E-commerce to <span className="text-gradient">Business Intelligence</span>
            </h2>
            <p className="mt-3 text-base text-[#3B4640] dark:text-[#A3B5AE] max-w-2xl mx-auto">
              Smarter E-Commerce. Stronger Business. Experience our 5-second cinematic brand journey on the left, paired with our live self-generating GMV & margin telemetry graph on the right.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 5-Second Vertical Cinematic Intro Animation */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <IconBulge tooltip="5-Second Intro">
                      <Sparkles className="h-4 w-4 text-[#7B2FE0] dark:text-[#BF8FFF]" />
                    </IconBulge>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3B4640] dark:text-muted-foreground">
                      Cinematic Brand Journey (5s)
                    </span>
                  </div>
                  <span className="rounded-full bg-[#BF8FFF]/25 px-2.5 py-0.5 text-[10px] font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">
                    Vertical View
                  </span>
                </div>
                <CinematicLogoIntro isEmbedded={true} />
              </div>
            </div>

            {/* Right: Live Self-Generating Graph & Metrics */}
            <div className="lg:col-span-7">
              <div className="mb-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A0] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#14B8A0]" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#3B4640] dark:text-muted-foreground">
                    Live Autonomous Telemetry Stream
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#14B8A0]">
                  Self-Generating Data
                </span>
              </div>
              <LiveTelemetryShowcase isEmbedded={true} />
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 5 CORE AUTONOMOUS CAPABILITIES (Scroll-Animated Feature Suite) */}
      <section id="how-it-works" className="scroll-reveal px-4 py-20 md:py-28 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="eyebrow">WHAT ECOMMIND DOES</span>
          <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#121A16] dark:text-white">
            5 Ways EcomMind Runs Your Business on Autopilot
          </h2>
          <p className="mt-4 text-base font-medium text-[#3B4640] dark:text-muted-foreground">
            Explore the core modules that turn complex inventory, supplier negotiations, and courier returns into a hands-free growth machine.
          </p>
        </div>

        {/* Feature Grid with Hatched Stripe Corners */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 icon-bulge-group">
          
          {/* Card 1: Multi-Channel Selling */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-tr flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCEDEA] dark:bg-white/10 text-[#7B2FE0] dark:text-[#BF8FFF] mb-5 shadow-xs">
                <IconBulge tooltip="Multi-Marketplace Synchronization">
                  <ShoppingBag className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Multi-Marketplace Synchronization</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                Connect your Amazon India, Flipkart, Meesho, and Shopify stores. EcomMind manages one unified inventory pool, eliminating overselling penalties and stockout headaches.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">
              <span className="text-bulge">Amazon · Flipkart · Meesho · Shopify</span>
              <IconBulge tooltip="Synchronized"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>

          {/* Card 2: Margin Engine */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-br flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#BF8FFF]/25 text-[#7B2FE0] mb-5 shadow-xs">
                <IconBulge tooltip="Real Pocket Margin Calculator">
                  <TrendingUp className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Real Pocket Margin Calculator</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                Traditional dashboards lie by showing only top-line sales. EcomMind continuously subtracts platform commissions, GST, forward freight, reverse RTO losses, and packaging to reveal your real net in-hand rupees.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#14B8A0]">
              <span className="text-bulge">Guaranteed profit per SKU</span>
              <IconBulge tooltip="Verified Profit"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>

          {/* Card 3: Autonomous Supplier Negotiation */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-tr flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14B8A0]/20 text-[#14B8A0] mb-5 shadow-xs">
                <IconBulge tooltip="Autonomous Supplier Negotiation">
                  <Handshake className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Autonomous Supplier Negotiations</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                When inventory dips below safe coverage, EcomMind discovers verified suppliers, compares delivery days and MOQ terms, and autonomously dispatches counter-offers within your daily mandate.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">
              <span className="text-bulge">Saves 6% to 14% on restocks</span>
              <IconBulge tooltip="Restock Counter Accepted"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>

          {/* Card 4: RTO & Courier Defense */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-br flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF9A3D]/20 text-[#FF9A3D] mb-5 shadow-xs">
                <IconBulge tooltip="Pincode RTO Risk Defense">
                  <Truck className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Pincode RTO Risk Defense</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                Returns destroy Indian e-commerce profits. EcomMind screens 19,000+ Indian pincodes for historical return risk, automatically routing high-risk parcels to top couriers like BlueDart or requiring OTP verification.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#FF9A3D]">
              <span className="text-bulge">Reduces RTO freight write-offs by 40%</span>
              <IconBulge tooltip="Protected Freight"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>

          {/* Card 5: Escrow Wallet */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-tr flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#23A6FF]/20 text-[#23A6FF] mb-5 shadow-xs">
                <IconBulge tooltip="Milestone Escrow Protection">
                  <ShieldCheck className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Milestone-Based Escrow Protection</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                Never pay upfront to unverified suppliers. EcomMind locks agreed purchase order funds in simulated or live escrow, releasing payout only when courier tracking verifies successful delivery.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#23A6FF]">
              <span className="text-bulge">100% Capital Protection</span>
              <IconBulge tooltip="Escrow Safeguarded"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>

          {/* Card 6: Festival Intelligence */}
          <motion.div
            whileHover={{ y: -4 }}
            className="card-surface card-bulge-interactive p-7 hatch-br flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF8A80]/20 text-[#FF8A80] mb-5 shadow-xs">
                <IconBulge tooltip="Festive Surge Intelligence">
                  <Flame className="h-6 w-6" />
                </IconBulge>
              </div>
              <h3 className="text-xl font-extrabold text-[#121A16] dark:text-white">Festival Demand Forecasts</h3>
              <p className="mt-3 text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                Diwali, Big Billion Days, and Great Indian Festival demand spikes are anticipated 45 days in advance. EcomMind pre-orders stock before supplier prices surge.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#FF8A80]">
              <span className="text-bulge">Zero festive stockout losses</span>
              <IconBulge tooltip="Festive Protection Verified"><Check className="h-4 w-4" /></IconBulge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. INTERACTIVE LIVE MARGIN SIMULATOR (Try before login!) */}
      <section id="margin-engine" className="scroll-reveal px-4 py-16 bg-[#DCEDEA]/40 dark:bg-white/5 border-y border-[#C9D6D3]/60 dark:border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow">LIVE INTERACTIVE TOOL</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121A16] dark:text-white mt-1">
              Experience the True Margin Engine
            </h2>
            <p className="text-xs sm:text-sm text-[#3B4640] dark:text-muted-foreground mt-2">
              Adjust the sliders below to test how EcomMind calculates real pocket profit after Indian marketplace fees.
            </p>
          </div>

          <div className="frosted-frame">
            <div className="card-surface p-6 sm:p-10 hatch-tr">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                
                {/* Sliders */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#3B4640] dark:text-muted-foreground">Product Selling Price (MRP/Listing)</span>
                      <span className="text-[#121A16] dark:text-white text-sm font-extrabold">₹ {sellingPrice}</span>
                    </div>
                    <input
                      type="range"
                      min={299}
                      max={4999}
                      step={50}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full accent-[#7B2FE0] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#3B4640] dark:text-muted-foreground">Supplier Unit Cost (Sourcing)</span>
                      <span className="text-[#121A16] dark:text-white text-sm font-extrabold">₹ {productCost}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={2500}
                      step={20}
                      value={productCost}
                      onChange={(e) => setProductCost(Number(e.target.value))}
                      className="w-full accent-[#7B2FE0] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#3B4640] dark:text-muted-foreground">Marketplace Commission (Amazon/Flipkart)</span>
                      <span className="text-[#121A16] dark:text-white text-sm font-extrabold">{platformFeePct}% (₹{commissionRupees})</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      step={1}
                      value={platformFeePct}
                      onChange={(e) => setPlatformFeePct(Number(e.target.value))}
                      className="w-full accent-[#7B2FE0] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#3B4640] dark:text-muted-foreground">Courier Freight + Packing</span>
                      <span className="text-[#121A16] dark:text-white text-sm font-extrabold">₹ {shippingFee}</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={200}
                      step={5}
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value))}
                      className="w-full accent-[#7B2FE0] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Real Profit Result Card */}
                <div className="rounded-2xl border border-[#C9D6D3] dark:border-white/10 bg-[#F2F6F6] dark:bg-black/40 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#C9D6D3]/50 dark:border-white/10">
                      <span className="text-xs font-bold text-[#3B4640]/80 uppercase">Calculated In-Hand Return</span>
                      <span className="rounded-full bg-[#14B8A0]/15 px-2.5 py-0.5 text-xs font-extrabold text-[#14B8A0]">
                        {netMarginPct}% Net Margin
                      </span>
                    </div>

                    <div className="my-6 text-center">
                      <p className="text-xs font-bold text-[#3B4640] uppercase">Real Pocket Profit per Unit</p>
                      <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#14B8A0] mt-1">
                        ₹ {formatNum(netPocketProfit)}
                      </p>
                      <p className="text-xs text-[#3B4640]/70 mt-1">
                        Out of ₹{sellingPrice} customer paid
                      </p>
                    </div>

                    <div className="space-y-2 text-xs border-t border-[#C9D6D3]/50 dark:border-white/10 pt-4 font-semibold text-[#3B4640] dark:text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Platform Commission</span>
                        <span className="text-[#FF8A80] font-bold">- ₹ {commissionRupees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Courier & Return Risk Allowance</span>
                        <span className="text-[#FF8A80] font-bold">- ₹ {shippingFee + rtoLossPerUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sourcing & Packaging</span>
                        <span className="text-[#FF8A80] font-bold">- ₹ {productCost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#C9D6D3]/60 dark:border-white/10">
                    <button
                      onClick={handleLaunchDemo}
                      className="w-full rounded-full btn-glow py-3 text-xs font-extrabold text-white text-center shadow-md hover:scale-102 transition-transform"
                    >
                      Audit Your Full Inventory Margins →
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE AI NEGOTIATION CHAT SIMULATOR */}
      <section id="supplier-negotiation" className="scroll-reveal px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow">AUTONOMOUS DEPLOYMENT</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121A16] dark:text-white mt-1">
            Watch EcomMind Negotiate with Suppliers
          </h2>
          <p className="text-xs sm:text-sm text-[#3B4640] dark:text-muted-foreground mt-2">
            Click through the simulated negotiation steps to see how the agent leverages wholesale market intelligence to win discounts without your manual intervention.
          </p>
        </div>

        <div className="frosted-frame max-w-3xl mx-auto">
          <div className="card-surface p-6 sm:p-8 hatch-tr">
            
            {/* Simulation Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#C9D6D3]/60 dark:border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCEDEA] text-[#7B2FE0] font-bold">
                  <IconBulge tooltip="Supplier Marketplace Node">
                    <Factory className="h-5 w-5" />
                  </IconBulge>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#121A16] dark:text-white">Surat Electronics Wholesale Ltd.</h4>
                  <p className="text-[11px] text-[#3B4640] dark:text-muted-foreground">SKU-AUDIO-002 (300 Units Restock)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNegotiationStep(1)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${negotiationStep === 1 ? 'bg-[#7B2FE0] text-white' : 'bg-black/5 dark:bg-white/10'}`}
                >
                  Step 1
                </button>
                <button
                  onClick={() => setNegotiationStep(2)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${negotiationStep === 2 ? 'bg-[#7B2FE0] text-white' : 'bg-black/5 dark:bg-white/10'}`}
                >
                  Step 2
                </button>
                <button
                  onClick={() => setNegotiationStep(3)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${negotiationStep === 3 ? 'bg-[#7B2FE0] text-white' : 'bg-black/5 dark:bg-white/10'}`}
                >
                  Step 3 (Won)
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4">
              
              {/* Message 1 */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#121A16] text-white text-xs font-bold">
                  S
                </div>
                <div className="rounded-2xl rounded-tl-none border border-[#C9D6D3] bg-white dark:bg-[#0E1511] p-3.5 max-w-md shadow-xs">
                  <p className="text-xs font-bold text-[#121A16] dark:text-white">Supplier Quote Received</p>
                  <p className="text-xs text-[#3B4640] dark:text-muted-foreground mt-1">
                    "We can provide 300 units of SKU-AUDIO-002 at <strong className="text-[#121A16] dark:text-white font-bold">₹210 / unit</strong>. Delivery within 4 business days."
                  </p>
                </div>
              </div>

              {/* Message 2 (EcomMind Counter) */}
              {negotiationStep >= 2 && (
                <div className="flex gap-3 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-2xl rounded-tr-none border border-[#7B2FE0]/30 bg-[#BF8FFF]/15 dark:bg-[#7B2FE0]/20 p-3.5 max-w-md shadow-xs text-right">
                    <p className="text-xs font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">EcomMind Agent Counter-Offer</p>
                    <p className="text-xs text-[#121A16] dark:text-white mt-1">
                      "Historical marketplace wholesale data for Gujarat region indicates fair volume pricing at ₹185. We can commit to immediate simulated escrow locking of ₹55,500 if agreed at <strong className="font-extrabold text-[#7B2FE0]">₹185 / unit</strong>."
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2FE0] to-[#BF8FFF] text-white text-xs font-bold">
                    AI
                  </div>
                </div>
              )}

              {/* Message 3 (Supplier Acceptance) */}
              {negotiationStep >= 3 && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14B8A0] text-white text-xs font-bold">
                    ✓
                  </div>
                  <div className="rounded-2xl rounded-tl-none border border-[#14B8A0]/40 bg-[#14B8A0]/10 p-3.5 max-w-md shadow-xs">
                    <p className="text-xs font-extrabold text-[#0F8A77] dark:text-[#14B8A0]">Counter Offer Accepted!</p>
                    <p className="text-xs text-[#121A16] dark:text-white mt-1">
                      "Deal finalized at ₹185/unit. You saved <strong className="font-extrabold text-[#14B8A0]">₹7,500</strong>. Escrow milestone generated and locked safely."
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#C9D6D3]/50 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#3B4640]">
              <span>Simulated autonomous negotiation</span>
              <button
                onClick={() => setNegotiationStep((prev) => (prev % 3) + 1)}
                className="font-bold text-[#7B2FE0] hover:underline"
              >
                Next Step →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DRAMATIC DARK SECTION: THE AUTONOMOUS NEURAL ENGINE & FESTIVAL RADAR */}
      <section className="scroll-reveal px-4 py-20 max-w-6xl mx-auto">
        <div className="dark-section p-8 sm:p-12 text-white">
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#14B8A0]/20 px-3 py-1 text-xs font-bold text-[#14B8A0]">
              <IconBulge tooltip="Autonomous 24/7 Engine">
                <Sparkles className="h-3 w-3" />
              </IconBulge>
              24/7 AUTONOMOUS DISCOVERY & EXECUTION
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              An AI Agent That Discovers, Negotiates and Protects
            </h2>
            <p className="text-sm sm:text-base text-[#A3B5AE] max-w-2xl mx-auto leading-relaxed">
              While you sleep, EcomMind continuously scouts competitor price shifts on Amazon India, balances inventory pools across Flipkart, and verifies supplier fulfillment.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 icon-bulge-group">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md card-bulge-interactive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF8FFF]/20 text-[#BF8FFF] mb-4">
                <IconBulge tooltip="Agent Discovery Grid">
                  <Bot className="h-5 w-5" />
                </IconBulge>
              </div>
              <h3 className="text-base font-extrabold text-white text-bulge">Agent Discovery Grid</h3>
              <p className="text-xs text-[#A3B5AE] mt-2 leading-relaxed">
                Automatically indexes third-party supplier bots, logistics rating bots, and marketplace repricing agents across India.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md card-bulge-interactive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A0]/20 text-[#14B8A0] mb-4">
                <IconBulge tooltip="Safe Spending Guardrails">
                  <ShieldCheck className="h-5 w-5" />
                </IconBulge>
              </div>
              <h3 className="text-base font-extrabold text-white text-bulge">Safe Spending Limits</h3>
              <p className="text-xs text-[#A3B5AE] mt-2 leading-relaxed">
                Set strict daily spending mandates. Agents can never exceed your authorized budget or commit to unverified purchases.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md card-bulge-interactive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9A3D]/20 text-[#FF9A3D] mb-4">
                <IconBulge tooltip="Festival Surge Intelligence">
                  <Flame className="h-5 w-5" />
                </IconBulge>
              </div>
              <h3 className="text-base font-extrabold text-white text-bulge">Festive Surge Intelligence</h3>
              <p className="text-xs text-[#A3B5AE] mt-2 leading-relaxed">
                Pre-calculates demand spikes for Diwali and Big Billion Days, ensuring optimal stock placement without stockout penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE SELLER ROI CALCULATOR */}
      <section id="roi-calculator" className="scroll-reveal px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow">MEASURABLE VALUE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121A16] dark:text-white mt-1">
            Calculate Your Projected Annual ROI
          </h2>
          <p className="text-xs sm:text-sm text-[#3B4640] dark:text-muted-foreground mt-2">
            See how much working capital EcomMind preserves across your monthly order volume.
          </p>
        </div>

        <div className="frosted-frame">
          <div className="card-surface p-6 sm:p-10 hatch-br">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#3B4640] dark:text-muted-foreground">Monthly Shipped Orders</span>
                    <span className="text-base font-extrabold text-[#121A16] dark:text-white">{formatNum(monthlyOrders)} orders/mo</span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={25000}
                    step={200}
                    value={monthlyOrders}
                    onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                    className="w-full accent-[#7B2FE0] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#3B4640] dark:text-muted-foreground">Average Order Value (AOV)</span>
                    <span className="text-base font-extrabold text-[#121A16] dark:text-white">₹ {formatNum(aov)}</span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={5000}
                    step={100}
                    value={aov}
                    onChange={(e) => setAov(Number(e.target.value))}
                    className="w-full accent-[#7B2FE0] cursor-pointer"
                  />
                </div>

                <div className="rounded-xl border border-[#C9D6D3]/60 dark:border-white/5 bg-[#F2F6F6]/60 dark:bg-white/5 p-4 text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#3B4640] dark:text-muted-foreground">Monthly GMV Handled:</span>
                    <span className="text-[#121A16] dark:text-white">₹ {formatNum(monthlyGmv)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-[#3B4640] dark:text-muted-foreground">Estimated Hours Saved per Week:</span>
                    <span className="text-[#14B8A0]">18.5 hrs / week</span>
                  </div>
                </div>
              </div>

              {/* Annual Impact Highlight */}
              <div className="rounded-2xl border border-[#14B8A0]/30 bg-[#DCEDEA]/40 dark:bg-white/5 p-6 sm:p-8 text-center flex flex-col justify-between">
                <div>
                  <span className="rounded-full bg-[#14B8A0]/20 px-3 py-1 text-xs font-bold text-[#14B8A0] uppercase">
                    Annual Bottom-Line Expansion
                  </span>
                  <p className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#121A16] dark:text-white">
                    ₹ {annualBenefitLakhs} <span className="text-xl sm:text-2xl text-[#14B8A0]">Lakhs / yr</span>
                  </p>
                  <p className="text-xs font-semibold text-[#3B4640] dark:text-muted-foreground mt-2">
                    Net savings from supplier discounts + blocked RTO losses
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    to="/register"
                    className="btn-glow inline-block w-full rounded-full py-3 text-xs font-extrabold text-white text-center shadow-lg hover:scale-102 transition-transform"
                  >
                    Unlock These Savings for Your Store →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 9. MANUAL SELLING VS ECOMMIND COMPARISON */}
      <section id="comparison" className="scroll-reveal px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow">HEAD-TO-HEAD COMPARISON</span>
          <h2 className="text-3xl font-extrabold text-[#121A16] dark:text-white mt-1">
            Why Top Sellers are Upgrading to EcomMind
          </h2>
        </div>

        <div className="card-surface p-6 sm:p-8 hatch-tr overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#C9D6D3]/60 dark:border-white/10 pb-3">
                  <th className="py-3 px-4 font-bold text-[#3B4640]/70 uppercase text-[11px]">Core Feature</th>
                  <th className="py-3 px-4 font-bold text-[#FF8A80] uppercase text-[11px]">Manual Selling / Excel</th>
                  <th className="py-3 px-4 font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF] uppercase text-[11px]">With EcomMind Autonomous AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9D6D3]/40 dark:divide-white/5">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#121A16] dark:text-white">Margin Auditing</td>
                  <td className="py-3.5 px-4 text-[#3B4640] dark:text-muted-foreground">Guesswork; hidden fees eat 15% profit</td>
                  <td className="py-3.5 px-4 font-bold text-[#14B8A0]">Real net in-hand rupees calculated per SKU</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#121A16] dark:text-white">Supplier Sourcing</td>
                  <td className="py-3.5 px-4 text-[#3B4640] dark:text-muted-foreground">Hours haggling on WhatsApp & Indiamart</td>
                  <td className="py-3.5 px-4 font-bold text-[#14B8A0]">AI evaluates quotes & auto-counters within mandate</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#121A16] dark:text-white">RTO Courier Risk</td>
                  <td className="py-3.5 px-4 text-[#3B4640] dark:text-muted-foreground">Blind shipping leading to 25-35% return losses</td>
                  <td className="py-3.5 px-4 font-bold text-[#14B8A0]">19,000+ Indian pincodes screened in real time</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#121A16] dark:text-white">Festive Surges</td>
                  <td className="py-3.5 px-4 text-[#3B4640] dark:text-muted-foreground">Out of stock during peak Diwali rush</td>
                  <td className="py-3.5 px-4 font-bold text-[#14B8A0]">Demand forecast 45 days ahead with safe re-orders</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-[#121A16] dark:text-white">Capital Safety</td>
                  <td className="py-3.5 px-4 text-[#3B4640] dark:text-muted-foreground">Advance payments lost to fraudulent vendors</td>
                  <td className="py-3.5 px-4 font-bold text-[#14B8A0]">Milestone escrow released only on tracked delivery</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10. INTERACTIVE FAQ ACCORDION */}
      <section id="faq" className="scroll-reveal px-4 py-16 max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="text-3xl font-extrabold text-[#121A16] dark:text-white mt-1">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Do I need any technical or coding knowledge to use EcomMind?',
              a: 'None at all. EcomMind is designed specifically for e-commerce sellers in India. You can either upload your standard CSV or XLSX files (Products, Sales History, Returns, Supplier Quotes) or link your marketplace account in a couple of clicks.',
            },
            {
              q: 'Can the AI agent spend money without my permission?',
              a: 'Never. You maintain 100% control via your Seller Spending Mandate. You define the daily budget, maximum cost per call, and maximum purchase order value. The agent will never exceed these guardrails.',
            },
            {
              q: 'Which Indian marketplaces and courier partners are supported?',
              a: 'EcomMind supports sales and catalogue data from Amazon India, Flipkart, Meesho, and Shopify. Logistics intelligence integrates with Delhivery, BlueDart, Xpressbees, and DTDC.',
            },
            {
              q: 'Does EcomMind support multiple GSTINs and Indian cities?',
              a: 'Yes. EcomMind validates all official 15-character Indian GSTIN numbers and offers autocomplete for all tier-1, tier-2, and tier-3 Indian cities.',
            },
          ].map((item, idx) => (
            <div key={idx} className="card-surface p-5 cursor-pointer" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[#121A16] dark:text-white">{item.q}</h4>
                <IconBulge tooltip={openFaq === idx ? "Collapse FAQ" : "Expand FAQ"}>
                  <ChevronDown className={`h-4 w-4 text-[#7B2FE0] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </IconBulge>
              </div>
              {openFaq === idx && (
                <p className="mt-3 text-xs sm:text-sm text-[#3B4640] dark:text-muted-foreground leading-relaxed pt-2 border-t border-[#C9D6D3]/40 dark:border-white/5 animate-in fade-in duration-200">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 11. FINAL HIGH-CONVERTING CTA BANNER */}
      <section id="cta" className="scroll-reveal px-4 py-20 max-w-5xl mx-auto">
        <div className="frosted-frame">
          <div className="card-surface p-8 sm:p-14 text-center hatch-tr relative overflow-hidden">
            <span className="eyebrow">READY TO GROW?</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#121A16] dark:text-white mt-2">
              Transform Your E-Commerce Business Today.
            </h2>
            <p className="text-sm sm:text-base font-medium text-[#3B4640] dark:text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
              Join Indian sellers who use EcomMind’s autonomous AI agents to reclaim lost margins, avoid stockouts, and negotiate winning supplier deals.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="btn-glow rounded-full px-8 py-3.5 text-sm font-extrabold text-white shadow-xl hover:scale-105 transition-transform"
              >
                Create Free Account →
              </Link>
              <button
                onClick={handleLaunchDemo}
                className="rounded-full border border-[#C9D6D3] dark:border-white/15 bg-white dark:bg-[#0E1511] px-6 py-3.5 text-sm font-bold text-[#121A16] dark:text-white hover:border-[#7B2FE0] transition-colors"
              >
                Instant Interactive Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. CLEAN EDITORIAL FOOTER */}
      <footer className="scroll-reveal border-t border-[#C9D6D3]/60 dark:border-white/10 px-6 py-12 text-xs text-[#3B4640] dark:text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-white/10 p-1 shadow-sm border border-[#C9D6D3]/60 dark:border-white/10">
              <IconBulge tooltip="EcomMind - Smarter E-Commerce. Stronger Business.">
                <EcomMindLogoMark className="h-6 w-6" />
              </IconBulge>
            </div>
            <div>
              <p className="font-extrabold text-[#091B3A] dark:text-white text-sm">
                Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-muted-foreground">Smarter E-Commerce. Stronger Business.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
            <Link to="/login" className="hover:text-[#7B2FE0]">Sign In</Link>
            <Link to="/register" className="hover:text-[#7B2FE0]">Register Store</Link>
            <button onClick={handleLaunchDemo} className="hover:text-[#7B2FE0]">Demo Business</button>
            <a href="#how-it-works" className="hover:text-[#7B2FE0]">Features</a>
            <a href="#margin-engine" className="hover:text-[#7B2FE0]">Margin Calculator</a>
          </div>

          <div className="text-center md:text-right text-[11px] text-[#3B4640]/70 dark:text-muted-foreground">
            © 2026 EcomMind Technologies India Pvt. Ltd. · Simulated demo calculations.
          </div>
        </div>
      </footer>
    </div>
  )
}
