import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            An unexpected error occurred while rendering this view. You can try refreshing or heading back to the dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
            <Button
              onClick={() => {
                this.handleReset()
                window.location.href = '/'
              }}
              className="gap-2 bg-gradient-to-r from-[#0066FF] to-[#7B2FE0] text-white hover:opacity-90 border-0"
            >
              <Home className="h-4 w-4" /> Go to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
