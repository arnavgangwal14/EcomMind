import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { cx } from '@/lib/format'
import { ArrowUpRight, Sparkles, X } from 'lucide-react'
import { useExploreModal } from '@/components/ExploreModal'

export default function AppLayout({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)
  const { open: openExplore } = useExploreModal()

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-gradient-to-b from-[#DDEEEB] via-[#E2EAF1] to-[#E6E6F6] text-[#121A16] dark:from-[#060B08] dark:to-[#0A0F0D] dark:text-[#F2F6F6] flex flex-col font-sans selection:bg-[#BF8FFF]/40">
        
        {/* Top 44px Semrush-style Announcement Bar */}
        {!announcementDismissed && (
          <aside
            aria-label="Announcement"
            className="relative z-40 flex h-11 w-full items-center justify-between bg-[#BF8FFF] px-4 text-[#121A16] shadow-sm transition-all duration-200"
          >
            <div className="mx-auto flex items-center gap-2 text-xs sm:text-[13px] font-medium tracking-tight">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#121A16] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                <Sparkles className="h-3 w-3 text-[#BF8FFF]" />
                New
              </span>
              <span>
                <strong className="font-extrabold uppercase tracking-wide">Try EcomMind Free</strong> — AI-powered insights, autonomous negotiation & margin intelligence for Indian e-commerce sellers
              </span>
              <button
                onClick={openExplore}
                className="hidden md:inline-flex items-center gap-0.5 font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Explore Live Demo <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setAnnouncementDismissed(true)}
              className="rounded-full p-1 text-[#121A16]/70 hover:bg-[#121A16]/10 hover:text-[#121A16] transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </aside>
        )}

        <div className="flex flex-1">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <div
            className={cx(
              'flex flex-1 flex-col transition-[padding] duration-200 w-full',
              collapsed ? 'lg:pl-[68px]' : 'lg:pl-64',
            )}
          >
            <AppHeader />
            <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 md:px-8">
              {children ?? <Outlet />}
            </main>
            <footer className="border-t border-[#C9D6D3]/60 dark:border-white/10 px-6 py-6 text-center text-xs text-[#3B4640] dark:text-muted-foreground">
              <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#121A16] dark:text-white">EcomMind</span>
                  <span>·</span>
                  <span>Smarter E-Commerce. Stronger Business.</span>
                </div>
                <div>All autonomous calculations & payments on this demo are safely simulated.</div>
              </div>
            </footer>
          </div>
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              border: '1px solid #C9D6D3',
              color: '#121A16',
              borderRadius: '16px',
              boxShadow: '0 16px 40px rgba(18, 26, 22, 0.08)',
            },
            className: 'dark:!bg-[#0E1511] dark:!border-white/15 dark:!text-white',
          }}
        />
      </div>
    </TooltipProvider>
  )
}
