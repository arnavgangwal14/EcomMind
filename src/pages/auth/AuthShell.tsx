import type { ReactNode } from 'react'
import { Sparkles, ShieldCheck, Handshake } from 'lucide-react'
import { Toaster } from 'sonner'
import { Link } from 'react-router'
import { ThemeToggle } from '@/components/ThemeToggle'
import { EcomMindLogoMark } from '@/components/brand/EcomMindLogo'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-gradient-to-b from-[#DDEEEB] via-[#E2EAF1] to-[#E6E6F6] text-[#121A16] dark:from-[#060B08] dark:to-[#0A0F0D] dark:text-[#F2F6F6]">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-[#C9D6D3]/60 dark:border-white/10 bg-white/70 dark:bg-[#0E1511]/80 backdrop-blur-md p-10 lg:flex hatch-tr">
        <div className="relative flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-white/10 p-1.5 shadow-sm border border-[#C9D6D3]/60 dark:border-white/10">
              <EcomMindLogoMark className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-[#091B3A] dark:text-white">
                Ecom<span className="text-[#0066FF] dark:text-[#23A6FF]">Mind</span>
              </p>
              <p className="text-[10px] font-bold tracking-widest text-[#64748B] dark:text-muted-foreground uppercase">Smarter E-Commerce</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative my-auto py-8">
          <span className="eyebrow">AUTONOMOUS BUSINESS PLATFORM</span>
          <h1 className="mt-3 max-w-md text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-[#121A16] dark:text-white">
            Not another dashboard. <span className="text-gradient">An AI agent that discovers, negotiates with and pays other agents</span> for you.
          </h1>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Sparkles, text: 'Forecasts demand and detects stockouts before they cost you sales' },
              { icon: Handshake, text: 'Negotiates with supplier agents and locks the best volume price' },
              { icon: ShieldCheck, text: 'Pays suppliers through escrow — released only on verified delivery' },
            ].map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-sm font-semibold text-[#3B4640] dark:text-muted-foreground">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#DCEDEA] dark:bg-white/10 text-[#7B2FE0] dark:text-[#BF8FFF] shadow-xs">
                  <f.icon className="h-4 w-4" aria-hidden />
                </div>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between border-t border-[#C9D6D3]/50 dark:border-white/10 pt-4 text-xs font-semibold text-[#3B4640]/70 dark:text-muted-foreground">
          <span>Built for sellers on Amazon, Flipkart, Meesho & Shopify</span>
          <Link to="/" className="text-[#7B2FE0] dark:text-[#BF8FFF] hover:underline">
            Explore Tour →
          </Link>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="frosted-frame">
            <div className="card-surface p-7 sm:p-9 hatch-br">
              {children}
            </div>
          </div>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#FFFFFF', border: '1px solid #C9D6D3', color: '#121A16', borderRadius: '16px' },
          className: 'dark:!bg-[#0E1511] dark:!border-white/15 dark:!text-white',
        }}
      />
    </div>
  )
}
