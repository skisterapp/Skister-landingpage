import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  onGoHome?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  errorId?: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, errorId: generateErrorId() }
  }

  public componentDidCatch(error: unknown, info: unknown): void {
    // Intentionally console-only for now; can be wired to Sentry later.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error', error, info)
  }

  private handleReload = (): void => {
    if (typeof window === 'undefined') return
    window.location.reload()
  }

  private handleGoHome = (): void => {
    if (this.props.onGoHome) {
      this.props.onGoHome()
      return
    }
    if (typeof window === 'undefined') return
    window.location.href = '/'
  }

  private handleCopyErrorId = async (): Promise<void> => {
    if (!this.state.errorId) return
    if (typeof navigator === 'undefined') return
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(this.state.errorId)
  }

  public render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please try again</p>
          <p className="mt-3 text-xs text-muted-foreground">
            If this keeps happening, contact{' '}
            <a className="underline underline-offset-4" href="mailto:support@skister.app">
              support@skister.app
            </a>
            .
          </p>
          {this.state.errorId ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/90">Error ID</span> {this.state.errorId}
              </div>
              <button
                type="button"
                onClick={() => void this.handleCopyErrorId()}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-transparent px-3 text-xs font-semibold"
              >
                Copy
              </button>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

function generateErrorId(): string {
  const now = new Date()
  const ts = now.toISOString().replaceAll(':', '').replaceAll('.', '')
  const rand = Math.random().toString(16).slice(2, 10)
  return `E-${ts}-${rand}`
}

