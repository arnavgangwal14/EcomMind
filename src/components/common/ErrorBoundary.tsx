import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in EcomMind:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleClearAndReset = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // ignore
    }
    this.handleReset()
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.'

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-sm border border-red-200 dark:border-red-900/50">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-3">
            An unexpected error occurred while rendering this view. You can try refreshing, heading back to the dashboard, or resetting the app state.
          </p>

          {/* Diagnostic Error Details */}
          <div className="w-full max-w-lg mb-6 text-left">
            <div className="rounded-xl border border-red-200/80 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/30 p-3.5 text-xs text-red-800 dark:text-red-300 font-mono break-words shadow-inner">
              <span className="font-bold uppercase tracking-wider text-[10px] text-red-600 dark:text-red-400 block mb-1">
                Diagnostic Trace
              </span>
              {errorMessage}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="gap-2 rounded-full font-bold text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </Button>
            <Button
              onClick={() => {
                this.handleReset()
                window.location.href = '/'
              }}
              className="gap-2 bg-gradient-to-r from-[#0066FF] to-[#7B2FE0] text-white hover:opacity-90 border-0 rounded-full font-bold text-xs shadow-md shadow-blue-500/10"
            >
              <Home className="h-3.5 w-3.5" /> Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={this.handleClearAndReset}
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-full font-bold text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear Cache & Reset
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
