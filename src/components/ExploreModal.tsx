import { useEffect, useRef, useState } from 'react'
import {
  Activity, Bot, Compass,
  ShieldCheck, Sparkles, TrendingUp, Volume2, VolumeX, Wallet,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cx, formatNum } from '@/lib/format'

/* ------------------------------------------------------------------ */
/* Global state hook for opening Explore Modal from anywhere           */
/* ------------------------------------------------------------------ */
let globalOpenExplore: (() => void) | null = null

export function useExploreModal() {
  return {
    open: () => {
      if (globalOpenExplore) globalOpenExplore()
    },
  }
}

/* ------------------------------------------------------------------ */
/* Web Audio API Sound Generator for Cinematic Intro                  */
/* ------------------------------------------------------------------ */
function playCinematicSound(scene: number) {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    if (scene === 1) {
      // Scene 1: Bright electronic synth pulse & gentle arrival
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.8)
      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1.2)
    } else if (scene === 3) {
      // Scene 3: Rising whoosh as cart and lines separate in opposite directions
      const bufferSize = ctx.sampleRate * 0.8
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(300, now)
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.7)
      filter.Q.setValueAtTime(3, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.4)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + 0.8)
    } else if (scene === 4) {
      // Scene 4: Soft transition sound & rising arpeggio as graph emerges
      const notes = [330, 440, 554, 659, 880]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.1)
        gain.gain.setValueAtTime(0.001, now + idx * 0.1)
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.1)
        osc.stop(now + idx * 0.1 + 0.45)
      })
    } else if (scene === 5) {
      // Scene 5: Elegant polished harmonic chime when the logo locks in
      const chords = [523.25, 659.25, 783.99, 1046.5] // C Major 9
      chords.forEach((freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        gain.gain.setValueAtTime(0.001, now)
        gain.gain.linearRampToValueAtTime(0.1, now + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.9)
      })
    }
  } catch {
    // AudioContext blocked or not allowed by browser policy
  }
}

/* ------------------------------------------------------------------ */
/* Cinematic 5-Second Logo Intro Animation Component (Exported)       */
/* Continuous 5.5s loop without manual replay                         */
/* ------------------------------------------------------------------ */
export function CinematicLogoIntro({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [scene, setScene] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [elapsed, setElapsed] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const CYCLE_MS = 5500

  useEffect(() => {
    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const now = Date.now()
      const ms = (now - startTime) % CYCLE_MS
      setElapsed(ms)

      if (ms < 1200) {
        setScene(1)
      } else if (ms < 1800) {
        setScene((prev) => {
          if (prev !== 2 && soundEnabled) playCinematicSound(2)
          return 2
        })
      } else if (ms < 2800) {
        setScene((prev) => {
          if (prev !== 3 && soundEnabled) playCinematicSound(3)
          return 3
        })
      } else if (ms < 4000) {
        setScene((prev) => {
          if (prev !== 4 && soundEnabled) playCinematicSound(4)
          return 4
        })
      } else {
        setScene((prev) => {
          if (prev !== 5 && soundEnabled) playCinematicSound(5)
          return 5
        })
      }
    }, 40)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [soundEnabled])

  return (
    <div className={cx(
      'relative mx-auto flex w-full flex-col items-center overflow-hidden rounded-[28px] border border-[#C9D6D3] bg-gradient-to-b from-[#F8FBFA] via-[#FFFFFF] to-[#EFF5F4] p-5 sm:p-6 shadow-2xl transition-all dark:border-white/15 dark:from-[#0E1511] dark:via-[#111A15] dark:to-[#080D0B]',
      isEmbedded ? 'max-w-[460px]' : 'max-w-[420px]'
    )}>
      {/* Top Controls */}
      <div className="flex w-full items-center justify-between border-b border-[#C9D6D3]/60 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#14B8A0]" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#7B2FE0] dark:text-[#BF8FFF]">
            {scene === 1 && 'Scene 1: Shopping Cart Entrance'}
            {scene === 2 && 'Scene 2: Center Pause'}
            {scene === 3 && 'Scene 3: Opposite-Direction Separation'}
            {scene === 4 && 'Scene 4: Financial Graph Reveal'}
            {scene === 5 && 'Scene 5: EcomMind Brand Reveal'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              if (next) playCinematicSound(scene)
            }}
            className="rounded-full p-1.5 text-[#3B4640] hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors"
            title={soundEnabled ? 'Mute cinematic audio' : 'Enable cinematic audio'}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-[#7B2FE0] dark:text-[#BF8FFF]" /> : <VolumeX className="h-4 w-4 text-[#3B4640]/50" />}
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-[#14B8A0]/15 dark:bg-[#14B8A0]/20 px-2.5 py-1 text-[10px] font-extrabold text-[#14B8A0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A0] animate-ping" />
            Continuous Loop
          </div>
        </div>
      </div>

      {/* Animation Stage: vertical container */}
      <div className="relative mt-4 flex h-[460px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#F2F7F6] to-[#E5EFEF] p-4 dark:from-[#080D0B] dark:to-[#0D1512]">
        
        {/* Soft Background Radial Light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,47,224,0.12)_0%,transparent_70%)] pointer-events-none" />

        {/* Scene 1 & 2 & 3: EXACT LOGO SHOPPING CART & 3 MOTION LINES */}
        {(scene === 1 || scene === 2 || scene === 3) && (
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* THREE EXACT HORIZONTAL BLUE MOTION LINES FROM LOGO */}
            <div
              className={cx(
                'absolute flex items-center transition-all duration-700 pointer-events-none',
                scene === 1 && 'left-[14%] translate-x-0 opacity-85',
                scene === 2 && 'left-[20%] translate-x-0 opacity-100 scale-105 filter drop-shadow-[0_0_12px_#23A6FF]',
                // SCENE 3 CRITICAL: Lines sweep quickly toward the LEFT!
                scene === 3 && '-left-[60%] -translate-x-full opacity-0 blur-xs transition-all duration-800 ease-in',
              )}
            >
              <img
                src="/logo-lines-cropped.png"
                alt="Logo Motion Lines"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_0_8px_rgba(35,166,255,0.7)]"
              />
            </div>

            {/* EXACT ECOMMIND LOGO SHOPPING CART */}
            <div
              className={cx(
                'relative flex flex-col items-center transition-all pointer-events-none',
                // Scene 1: Enters smoothly from extreme left, moves deliberately toward center
                scene === 1 && 'translate-x-[-150px] opacity-90 duration-1000 ease-out',
                // Scene 2: Settles at center
                scene === 2 && 'translate-x-0 scale-105 duration-300 ease-in-out',
                // SCENE 3 CRITICAL: Shopping cart accelerates quickly toward the RIGHT!
                scene === 3 && 'translate-x-[280px] opacity-0 blur-xs scale-95 duration-700 ease-in',
              )}
            >
              {/* Floating E-Commerce Elements in Cart */}
              <div className="relative mb-[-12px] z-10 flex items-end justify-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#BF8FFF] to-[#7B2FE0] shadow-md flex items-center justify-center text-white text-[11px] font-bold animate-bounce">
                  📦
                </div>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#14B8A0] to-[#0D9488] shadow-md flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  🛍️
                </div>
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#23A6FF] to-[#0052CC] shadow-md flex items-center justify-center text-white text-[10px] font-bold">
                  ₹
                </div>
              </div>

              {/* Exact EcomMind Shopping Cart Artwork */}
              <div className="relative flex h-32 sm:h-36 w-auto items-center justify-center drop-shadow-[0_16px_32px_rgba(0,102,255,0.4)]">
                <img
                  src="/logo-cart-cropped.png"
                  alt="EcomMind Logo Cart"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scene 4: FINANCIAL GROWTH GRAPH REVEAL (From clear center path) */}
        {scene === 4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-75 duration-700">
            <div className="absolute h-52 w-52 rounded-full bg-[#0066FF]/25 blur-3xl animate-ping opacity-50 pointer-events-none" />

            {/* Rising Analytics Graph Container with Logo Growth Bars */}
            <div className="relative z-10 flex h-60 w-full flex-col justify-between rounded-2xl border border-[#C9D6D3] dark:border-white/15 bg-white/95 dark:bg-[#0E1511]/95 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#C9D6D3]/50 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#14B8A0]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#14B8A0]">
                    +25% Growth
                  </span>
                  <span className="rounded-full bg-[#7B2FE0]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF]">
                    +12% Margin
                  </span>
                </div>
                <span className="text-xs font-bold text-[#121A16] dark:text-white">₹ 48.2 Lakhs</span>
              </div>

              {/* Exact Logo Growth Bars & Arrow Artwork */}
              <div className="relative flex-1 flex items-center justify-center py-2">
                <img
                  src="/logo-bars-cropped.png"
                  alt="Financial Growth Bars"
                  className="h-28 sm:h-32 w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,163,255,0.5)] animate-in zoom-in-90 duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-[#3B4640] dark:text-muted-foreground pt-2 border-t border-[#C9D6D3]/40 dark:border-white/5">
                <span>Autonomous Margin Optimization</span>
                <span className="text-[#14B8A0] font-bold">↗ Verified Uplift</span>
              </div>
            </div>
          </div>
        )}

        {/* Scene 5: EXACT ECOMMIND LOGO AND TAGLINE REVEAL */}
        {scene === 5 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-800">
            <div className="absolute h-72 w-72 rounded-full bg-gradient-to-tr from-[#0066FF]/20 via-[#00A3FF]/20 to-[#14B8A0]/15 blur-3xl pointer-events-none" />

            {/* Official EcomMind Logo Mark from Reference Artwork */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white dark:bg-white/10 p-3 shadow-2xl shadow-blue-500/25 border border-[#C9D6D3]/60 dark:border-white/10">
                <img
                  src="/logo-mark.png"
                  alt="EcomMind Logo Mark"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Wordmark matching exact artwork */}
              <h1 className="relative z-10 mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#091B3A] dark:text-white">
                Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
              </h1>

              {/* Exact Tagline */}
              <p className="relative z-10 mt-2 text-sm sm:text-base font-semibold tracking-wide text-[#64748B] dark:text-[#CBD5E1]">
                Smarter E-Commerce. Stronger Business.
              </p>
            </div>

            {/* Badges */}
            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-[#DCEDEA] dark:bg-white/10 px-3 py-1 text-xs font-bold text-[#121A16] dark:text-white">
                Autonomous AI Agents
              </span>
              <span className="rounded-full bg-[#0066FF]/15 px-3 py-1 text-xs font-bold text-[#0066FF] dark:text-[#23A6FF]">
                Margin Protection
              </span>
              <span className="rounded-full bg-[#14B8A0]/15 px-3 py-1 text-xs font-bold text-[#14B8A0]">
                RTO Optimization
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Clean Bottom Progress Indicator (No timer numbers displayed) */}
      <div className="mt-4 flex w-full items-center justify-center">
        <div className="h-1.5 w-full rounded-full bg-[#C9D6D3]/40 dark:bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#23A6FF] via-[#7B2FE0] to-[#14B8A0] transition-all duration-75 shadow-[0_0_10px_rgba(35,166,255,0.8)]"
            style={{ width: `${Math.min(100, (elapsed / 5500) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live Telemetry Showcase Component (Continuous Gliding Stream)      */
/* ------------------------------------------------------------------ */
interface LivePoint {
  time: string
  revenue: number
  margin: number
  orders: number
  savings: number
}

// Generate 60 initial points for immediate full-width smooth chart
function generateInitial60Points(): LivePoint[] {
  const points: LivePoint[] = []
  let rev = 136800
  let margin = 31.2
  let orders = 94
  let savings = 18400
  const now = Date.now()

  for (let i = 59; i >= 0; i--) {
    const t = new Date(now - i * 950)
    const timeStr = t.toLocaleTimeString('en-IN', { hour12: false })
    rev += Math.floor(Math.sin(i * 0.2) * 120 + Math.random() * 260 + 80)
    margin = Math.min(36, Math.max(29, +(margin + (Math.sin(i * 0.3) * 0.15 + (Math.random() * 0.2 - 0.08))).toFixed(1)))
    if (i % 3 === 0) orders += 1
    savings += Math.floor(Math.random() * 90 + 35)

    points.push({
      time: timeStr,
      revenue: rev,
      margin,
      orders,
      savings,
    })
  }
  return points
}

const STREAM_EVENTS = [
  { id: 1, title: 'Negotiation won', text: 'Saved ₹4,500 on SKU-LED-005 (counter accepted at ₹180)', tone: 'success' },
  { id: 2, title: 'Escrow locked', text: '₹18,500 locked for Inbound Batch #409 with Delhivery', tone: 'info' },
  { id: 3, title: 'RTO blocked', text: 'Pincode 110006 flagged — 38% historical return risk', tone: 'warning' },
  { id: 4, title: 'Auto-repriced', text: 'Repriced Earbuds on Amazon from ₹1,499 to ₹1,549 to protect 32% margin', tone: 'purple' },
  { id: 5, title: 'Diwali stock allocated', text: '48 units reserved across Mumbai & Bengaluru hubs', tone: 'info' },
]

export function LiveTelemetryShowcase({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [data, setData] = useState<LivePoint[]>(generateInitial60Points)
  const [glideOffset, setGlideOffset] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<(typeof STREAM_EVENTS)[0] | null>(null)
  const [orderPopped, setOrderPopped] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const lastTickTimeRef = useRef<number>(Date.now())
  const isVisibleRef = useRef<boolean>(true)
  const isPrefersReduced = useRef<boolean>(false)

  // 1. Data Generator: Seeded random walk produces new point every 950ms
  useEffect(() => {
    isPrefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // IntersectionObserver to pause loop when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting && !document.hidden
    }, { threshold: 0.1 })

    if (containerRef.current) observer.observe(containerRef.current)

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const tickInterval = isPrefersReduced.current ? 5000 : 950

    const interval = setInterval(() => {
      if (!isVisibleRef.current) return

      setData((prev) => {
        const last = prev[prev.length - 1]
        const now = new Date()
        const timeStr = now.toLocaleTimeString('en-IN', { hour12: false })

        // Random walk with upward drift + gentle seasonality
        const wave = Math.sin(Date.now() / 4000) * 140
        const randomDrift = Math.floor(Math.random() * 450) + 120
        const newRev = last.revenue + Math.round(wave + randomDrift)

        const marginWave = Math.sin(Date.now() / 6000) * 0.25
        const marginDelta = Math.random() * 0.3 - 0.12
        const newMargin = Math.min(38, Math.max(29.5, +(last.margin + marginWave + marginDelta).toFixed(1)))

        const willOrderIncrement = Math.random() > 0.45
        const newOrders = last.orders + (willOrderIncrement ? 1 : 0)
        if (willOrderIncrement) {
          setOrderPopped(true)
          setTimeout(() => setOrderPopped(false), 500)
        }

        const newSavings = Math.round(last.savings + randomDrift * 0.22)

        const nextPoint: LivePoint = {
          time: timeStr,
          revenue: newRev,
          margin: newMargin,
          orders: newOrders,
          savings: newSavings,
        }

        lastTickTimeRef.current = Date.now()
        return [...prev.slice(1), nextPoint]
      })
    }, tickInterval)

    // 2. RequestAnimationFrame smooth continuous glide interpolation
    let animationFrameId: number
    const animateGlide = () => {
      if (isVisibleRef.current && !isPrefersReduced.current) {
        const elapsedSinceLastTick = Date.now() - lastTickTimeRef.current
        const progress = Math.min(1, elapsedSinceLastTick / tickInterval)
        // Spacing between points is approx 9.4px
        setGlideOffset(progress * 9.4)
      }
      animationFrameId = requestAnimationFrame(animateGlide)
    }
    animationFrameId = requestAnimationFrame(animateGlide)

    // 3. Floating Event Toast every 11 seconds
    let eventIdx = 0
    const eventInterval = setInterval(() => {
      if (!isVisibleRef.current) return
      const evt = STREAM_EVENTS[eventIdx % STREAM_EVENTS.length]
      eventIdx++
      setCurrentEvent(evt)
      setIsFlashing(true)

      setTimeout(() => setIsFlashing(false), 800)
      setTimeout(() => setCurrentEvent(null), 4500)
    }, 11000)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
      clearInterval(eventInterval)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const latest = data[data.length - 1] || { revenue: 152400, margin: 34.2, orders: 112, savings: 21400, time: '' }
  const first = data[0] || latest
  const revenueGrowthPct = first.revenue > 0 ? (((latest.revenue - first.revenue) / first.revenue) * 100).toFixed(1) : '14.2'

  // Dimensions for custom SVG chart
  const svgWidth = 660
  const svgHeight = 220
  const padLeft = 60
  const padRight = 35
  const padTop = 25
  const padBottom = 30
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  // Compute smooth min and max for auto-rescaling y-axis
  const revValues = data.map((d) => d.revenue)
  const minRev = Math.min(...revValues) - 800
  const maxRev = Math.max(...revValues) + 1200
  const revRange = Math.max(1, maxRev - minRev)

  // Build SVG path coordinates with gliding
  const pointCoords = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotWidth
    const y = padTop + plotHeight - ((d.revenue - minRev) / revRange) * plotHeight
    return { x, y, point: d }
  })

  // SVG Line Path
  const lineD = pointCoords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  // SVG Area Path
  const areaD = `${lineD} L ${padLeft + plotWidth} ${padTop + plotHeight} L ${padLeft} ${padTop + plotHeight} Z`

  // Secondary Line: Gross Margin % Overlay (scaled to bottom half)
  const marginCoords = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotWidth
    const marginNorm = (d.margin - 28) / 12 // map 28% to 40% into 0..1
    const y = padTop + plotHeight - marginNorm * (plotHeight * 0.45)
    return { x, y }
  })
  const marginLineD = marginCoords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const lastCoord = pointCoords[pointCoords.length - 1]

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const svgX = (mouseX / rect.width) * svgWidth
    if (svgX < padLeft || svgX > padLeft + plotWidth) {
      setHoverIndex(null)
      setHoverPos(null)
      return
    }
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(((svgX - padLeft) / plotWidth) * (data.length - 1))))
    setHoverIndex(idx)
    setHoverPos({ x: mouseX, y: e.clientY - rect.top })
  }

  return (
    <div ref={containerRef} className={cx('space-y-4 select-none', isEmbedded ? '' : '')}>
      {/* 1. Live Animated KPI Cards derived from real-time stream */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 icon-bulge-group">
        <div className="card-surface p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">Live Telemetry GMV</span>
            <span className="text-[10px] font-extrabold text-[#14B8A0] bg-[#14B8A0]/10 px-2 py-0.5 rounded-full">
              +{revenueGrowthPct}%
            </span>
          </div>
          <p className="mt-2 text-xl font-extrabold tabular text-[#121A16] dark:text-white">
            ₹{formatNum(latest.revenue)}
          </p>
          <span className="text-[11px] text-[#3B4640]/70 dark:text-muted-foreground">Autonomous order ledger</span>
        </div>

        <div className="card-surface p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">Dynamic Gross Margin</span>
            <span className="text-[10px] font-extrabold text-[#7B2FE0] dark:text-[#BF8FFF] bg-[#BF8FFF]/20 px-2 py-0.5 rounded-full">
              +3.4%
            </span>
          </div>
          <p className="mt-2 text-xl font-extrabold tabular text-[#7B2FE0] dark:text-[#BF8FFF]">
            {latest.margin.toFixed(1)}%
          </p>
          <span className="text-[11px] text-[#3B4640]/70 dark:text-muted-foreground">Protected by AI repricing</span>
        </div>

        <div className="card-surface p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">Negotiated Savings</span>
            <Sparkles className="h-3.5 w-3.5 text-[#FF9A3D]" />
          </div>
          <p className="mt-2 text-xl font-extrabold tabular text-[#14B8A0]">
            ₹{formatNum(latest.savings)}
          </p>
          <span className="text-[11px] text-[#3B4640]/70 dark:text-muted-foreground">Supplier margin reclaimed</span>
        </div>

        <div className="card-surface p-4 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">Settled Orders</span>
            <ShieldCheck className="h-3.5 w-3.5 text-[#23A6FF]" />
          </div>
          <p className={cx('mt-2 text-xl font-extrabold tabular text-[#121A16] dark:text-white transition-transform duration-200', orderPopped && 'scale-115 text-[#14B8A0]')}>
            {latest.orders}
          </p>
          <span className="text-[11px] text-[#3B4640]/70 dark:text-muted-foreground">Real-time simulated sync</span>
        </div>
      </div>

      {/* 2. Frosted Frame with Continuous Moving Telemetry Graph */}
      <div className="frosted-frame relative">
        <div className="card-surface p-5 hatch-tr relative overflow-hidden">
          
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#121A16] dark:text-white">
                  Self-Generating Live GMV & Autonomous Margins
                </h3>
                <span className="rounded-full bg-[#14B8A0]/10 px-2 py-0.5 text-[9px] font-extrabold text-[#14B8A0]">
                  Sample data
                </span>
              </div>
              <p className="text-xs text-[#3B4640] dark:text-muted-foreground mt-0.5">
                Simulated real-time streaming agent actions across Amazon, Flipkart & Meesho
              </p>
            </div>

            {/* Permanent Live Autonomous Stream Badge (No Pause Button) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-[#14B8A0]/40 bg-[#14B8A0]/10 px-3 py-1 text-xs font-bold text-[#14B8A0]">
                <span className="h-2 w-2 rounded-full bg-[#14B8A0] animate-ping" />
                <span>Live Continuous Stream</span>
              </div>
            </div>
          </div>

          {/* Floating Event Toast (Slides in every 11s) */}
          {currentEvent && (
            <div className="absolute top-16 right-6 z-30 max-w-sm rounded-xl border border-[#7B2FE0]/40 bg-white/95 dark:bg-[#0E1511]/95 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#14B8A0]" />
                <p className="text-xs font-bold text-[#121A16] dark:text-white uppercase tracking-wider">
                  {currentEvent.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-[#3B4640] dark:text-muted-foreground">
                {currentEvent.text}
              </p>
            </div>
          )}

          {/* Gliding 60fps Vector SVG Graph */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#F4F9F8] to-white dark:from-[#080D0B] dark:to-[#0D1512] border border-[#C9D6D3]/40 dark:border-white/5">
            <svg
              className="h-full w-full cursor-crosshair"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                setHoverIndex(null)
                setHoverPos(null)
              }}
              aria-label="Real-time simulated telemetry graph showing GMV and margin trends"
            >
              <defs>
                {/* Violet GMV Gradient Area */}
                <linearGradient id="liveStreamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B2FE0" stopOpacity={0.4} />
                  <stop offset="90%" stopColor="#7B2FE0" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = padTop + plotHeight * p
                const val = Math.round(maxRev - p * revRange)
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.08}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      fill="currentColor"
                      opacity={0.5}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      ₹{Math.round(val / 1000)}k
                    </text>
                  </g>
                )
              })}

              {/* Continuous Gliding Line & Area Group (Translates leftwards smoothly) */}
              <g transform={`translate(${-glideOffset}, 0)`}>
                {/* Area Gradient */}
                <path d={areaD} fill="url(#liveStreamGrad)" />

                {/* Primary GMV Line */}
                <path
                  d={lineD}
                  fill="none"
                  stroke="#7B2FE0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cx(isFlashing && 'line-flashing')}
                />

                {/* Secondary Gross Margin % Overlay Line */}
                <path
                  d={marginLineD}
                  fill="none"
                  stroke="#14B8A0"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </g>

              {/* Newest Point Glowing & Pulsing "NOW" Dot */}
              {lastCoord && (
                <g>
                  {/* Vertical Guide Line */}
                  <line
                    x1={lastCoord.x}
                    y1={padTop}
                    x2={lastCoord.x}
                    y2={padTop + plotHeight}
                    stroke="#7B2FE0"
                    strokeDasharray="2 3"
                    opacity={0.3}
                  />

                  {/* Outer Pulsing Ping Dot */}
                  <circle
                    cx={lastCoord.x}
                    cy={lastCoord.y}
                    r="8"
                    className="fill-[#14B8A0] opacity-35 animate-ping"
                  />

                  {/* Inner Solid Dot */}
                  <circle
                    cx={lastCoord.x}
                    cy={lastCoord.y}
                    r="4.5"
                    fill="#7B2FE0"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="drop-shadow-md"
                  />
                </g>
              )}

              {/* Interactive Crosshair on Hover */}
              {hoverIndex !== null && pointCoords[hoverIndex] && (
                <g>
                  <line
                    x1={pointCoords[hoverIndex].x}
                    y1={padTop}
                    x2={pointCoords[hoverIndex].x}
                    y2={padTop + plotHeight}
                    stroke="#121A16"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity={0.4}
                  />
                  <circle
                    cx={pointCoords[hoverIndex].x}
                    cy={pointCoords[hoverIndex].y}
                    r="4.5"
                    fill="#14B8A0"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay (No timestamp / timer displayed) */}
            {hoverIndex !== null && hoverPos && data[hoverIndex] && (
              <div
                style={{
                  left: Math.min(hoverPos.x + 12, 480),
                  top: Math.max(hoverPos.y - 65, 12),
                }}
                className="pointer-events-none absolute z-40 rounded-xl border border-[#C9D6D3] dark:border-white/20 bg-white/95 dark:bg-[#0E1511]/95 p-2.5 shadow-xl backdrop-blur-md text-[11px]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#C9D6D3]/50 pb-1 mb-1">
                  <span className="font-semibold text-[10px] text-[#7B2FE0] dark:text-[#BF8FFF]">
                    Live Telemetry Node
                  </span>
                  <span className="rounded-full bg-[#BF8FFF]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF]">
                    Sample data
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[#121A16] dark:text-white">
                    GMV: ₹{formatNum(data[hoverIndex].revenue)}
                  </p>
                  <p className="font-bold text-[#14B8A0]">
                    Margin: {data[hoverIndex].margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#3B4640]/70 dark:text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7B2FE0]" />
              Violet: Continuous Live GMV
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A0]" />
              Teal: Dynamic Margin % Overlay
            </span>
            <span>Self-Generating Data · 60s Window</span>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ */
/* Explore Button (Uiverse design inspired by nathAd17)               */
/* ------------------------------------------------------------------ */
export function ExploreButton({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'compact'
  className?: string
}) {
  const [open, setOpen] = useState(false)

  // Register global opener so header or hero can launch
  useEffect(() => {
    globalOpenExplore = () => setOpen(true)
    return () => {
      globalOpenExplore = null
    }
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          'flex justify-center gap-2 items-center shadow-lg font-bold bg-white dark:bg-[#0E1511] text-[#121A16] dark:text-white backdrop-blur-md isolation-auto border border-[#C9D6D3] dark:border-white/15',
          'before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-gradient-to-r before:from-[#BF8FFF] before:to-[#7B2FE0] hover:text-white before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700',
          'relative z-10 overflow-hidden rounded-full group cursor-pointer transition-all duration-300',
          variant === 'compact' ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
          className,
        )}
        title="Explore EcomMind Platform & 5-Second Cinematic Intro"
        aria-label="Explore EcomMind platform and live graph"
      >
        <span>Explore</span>
        <svg
          className={cx(
            'justify-end group-hover:rotate-90 group-hover:bg-white/20 text-[#121A16] dark:text-white group-hover:text-white ease-linear duration-300 rounded-full border border-[#C9D6D3] dark:border-white/15 group-hover:border-none rotate-45 transition-all',
            variant === 'compact' ? 'w-5 h-5 p-1' : 'w-6 h-6 p-1.5',
          )}
          viewBox="0 0 16 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
            className="fill-current"
          />
        </svg>
      </button>

      <ExploreDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Main Interactive Modal Dialog                                      */
/* ------------------------------------------------------------------ */
export function ExploreDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<'intro' | 'live' | 'features'>('intro')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-[28px] border border-[#C9D6D3] dark:border-white/15 bg-white/95 dark:bg-[#0E1511]/95 shadow-2xl backdrop-blur-2xl">
        <DialogTitle className="sr-only">Explore EcomMind Platform & 5-Second Cinematic Intro</DialogTitle>

        {/* Modal Header */}
        <div className="relative border-b border-[#C9D6D3]/60 dark:border-white/10 bg-gradient-to-r from-[#DCEDEA]/50 via-white to-[#E6E6F6]/50 dark:from-white/5 dark:to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A0] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#14B8A0]" />
                </span>
                <span className="font-mono text-[11px] font-bold text-[#7B2FE0] dark:text-[#BF8FFF] tracking-wider uppercase">
                  FINTECH & E-COMMERCE INTELLIGENCE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#121A16] dark:text-white mt-1">
                From E-commerce to Business Intelligence
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#3B4640] dark:text-muted-foreground">
                Smarter E-Commerce. Stronger Business.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-full border border-[#C9D6D3] dark:border-white/10 bg-[#F2F6F6] dark:bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('intro')}
                className={cx(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                  activeTab === 'intro' ? 'bg-white text-[#121A16] dark:bg-white/15 dark:text-white shadow-xs' : 'text-[#3B4640] dark:text-muted-foreground hover:text-[#121A16]',
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#7B2FE0] dark:text-[#BF8FFF]" />
                Cinematic Intro
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={cx(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                  activeTab === 'live' ? 'bg-white text-[#121A16] dark:bg-white/15 dark:text-white shadow-xs' : 'text-[#3B4640] dark:text-muted-foreground hover:text-[#121A16]',
                )}
              >
                <Activity className="h-3.5 w-3.5 text-[#14B8A0]" />
                Live Self-Generating Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={cx(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                  activeTab === 'features' ? 'bg-white text-[#121A16] dark:bg-white/15 dark:text-white shadow-xs' : 'text-[#3B4640] dark:text-muted-foreground hover:text-[#121A16]',
                )}
              >
                <Compass className="h-3.5 w-3.5 text-[#23A6FF]" />
                Platform Details
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Cinematic 5-Second Intro */}
        {activeTab === 'intro' && (
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <CinematicLogoIntro />
          </div>
        )}

        {/* Tab 2: Live Self-Generating Graph */}
        {activeTab === 'live' && (
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <LiveTelemetryShowcase />
          </div>
        )}

        {/* Tab 3: Platform Details */}
        {activeTab === 'features' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-surface p-5 hatch-tr">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-[#BF8FFF]/25 text-[#7B2FE0]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#121A16] dark:text-white">Autonomous Supplier Negotiations</h4>
                </div>
                <p className="text-xs text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                  Agents discover suppliers, evaluate MOQ, lead times, and execute structured counter-offers within your configured budget mandate.
                </p>
              </div>

              <div className="card-surface p-5 hatch-br">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-[#14B8A0]/20 text-[#14B8A0]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#121A16] dark:text-white">Margin & Inventory Intelligence</h4>
                </div>
                <p className="text-xs text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                  Calculates real profit per SKU factoring in commissions, packing costs, return rates, and automated restock triggers before stockouts hit.
                </p>
              </div>

              <div className="card-surface p-5 hatch-br">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-[#FF9A3D]/20 text-[#FF9A3D]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#121A16] dark:text-white">RTO & Courier Optimization</h4>
                </div>
                <p className="text-xs text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                  Scores pincode risk in real time, alerting you to high-return zones and automatically routing parcels to top-performing courier partners.
                </p>
              </div>

              <div className="card-surface p-5 hatch-tr">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-[#23A6FF]/20 text-[#23A6FF]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#121A16] dark:text-white">Milestone-Based Escrow Wallet</h4>
                </div>
                <p className="text-xs text-[#3B4640] dark:text-muted-foreground leading-relaxed">
                  Autonomous transactions hold funds in escrow until shipment delivery confirmation or inspection milestones are verified.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
