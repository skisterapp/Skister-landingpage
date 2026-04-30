import React from 'react'

interface SafeFallbackProps {
  title?: string
  message?: string
  primaryLabel?: string
  onPrimaryAction?: () => void
  secondaryLabel?: string
  onSecondaryAction?: () => void
}

export function SafeFallback(props: SafeFallbackProps): React.ReactNode {
  const title = props.title ?? 'Something went wrong'
  const message = props.message ?? 'Please try again'

  return (
    <div className="min-h-[60dvh] bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          {props.primaryLabel ? (
            <button
              type="button"
              onClick={props.onPrimaryAction}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {props.primaryLabel}
            </button>
          ) : null}
          {props.secondaryLabel ? (
            <button
              type="button"
              onClick={props.onSecondaryAction}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold"
            >
              {props.secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

