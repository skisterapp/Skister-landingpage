import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ONBOARDING_DONE_KEY = 'onboarding_v1_done'
const SKISTER_LOGO_URL =
  'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterAppPro227.png'

export function Onboarding(props: { onDone?: () => void }): React.ReactNode {
  const slides = useMemo(() => getSlides(), [])
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const touchStartXRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(ONBOARDING_DONE_KEY) === 'true') props.onDone?.()
  }, [props])

  const handleDone = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
    props.onDone?.()
  }, [props])

  const handleNext = useCallback(() => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex((prev) => prev + 1)
      return
    }
    handleDone()
  }, [activeIndex, slides.length, handleDone])

  const handleBack = useCallback(() => {
    if (activeIndex === 0) return
    setActiveIndex((prev) => prev - 1)
  }, [activeIndex])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches?.[0]?.clientX ?? null
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const startX = touchStartXRef.current
      touchStartXRef.current = null
      if (startX === null) return
      const endX = e.changedTouches?.[0]?.clientX
      if (typeof endX !== 'number') return
      const deltaX = endX - startX
      if (Math.abs(deltaX) < 40) return
      if (deltaX < 0) handleNext()
      else handleBack()
    },
    [handleBack, handleNext]
  )

  const slide = slides[activeIndex]
  const primaryLabel = activeIndex === slides.length - 1 ? 'Get started' : 'Next'

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden bg-background text-text-primary flex items-center justify-center p-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(46,232,154,0.2),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md text-center">
        <div className="absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-primary/40 via-primary/10 to-primary-light/20 opacity-80 blur-sm" aria-hidden />
        <div className="relative overflow-hidden rounded-[1.25rem] border border-border bg-surface/95 px-6 py-8 shadow-[0_0_60px_var(--glow)] backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-text-primary">
              {slide.title}
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-text-secondary">{slide.message}</p>
          </div>

          {slide.imageSrc ? (
            <div className="mx-auto mt-6 max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-inner">
              <img
                src={slide.imageSrc}
                alt={slide.imageAlt}
                className="mx-auto h-44 w-full object-contain"
              />
            </div>
          ) : null}

          <div
            className="mt-6 flex items-center justify-center gap-2"
            aria-label="Onboarding progress"
          >
            {slides.map((_, i) => (
              <div
                key={i}
                className={[
                  'h-2 rounded-full transition-all duration-300',
                  i === activeIndex ? 'w-7 bg-primary shadow-[0_0_12px_var(--glow)]' : 'w-2 bg-border'
                ].join(' ')}
                aria-hidden
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={activeIndex === 0}
              className="inline-flex h-11 min-w-[6.5rem] items-center justify-center rounded-xl border border-border bg-surface-secondary px-5 text-sm font-semibold text-text-primary transition hover:border-primary/30 hover:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 min-w-[6.5rem] items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_var(--glow)] transition hover:bg-primary-dark"
            >
              {primaryLabel}
            </button>
          </div>

          <p className="mt-5 text-center text-xs tracking-wide text-text-tertiary">
            Swipe left or right to explore
          </p>
        </div>
      </div>
    </div>
  )
}

function getSlides(): Slide[] {
  return [
    {
      title: 'Share ski gear with your network',
      message: 'Skister helps you coordinate lending and borrowing with people you trust.',
      imageSrc: SKISTER_LOGO_URL,
      imageAlt: 'Skister app logo'
    },
    {
      title: 'List your gear → others can borrow it',
      message: 'Add gear to your inventory so your network can request it.',
      imageSrc: SKISTER_LOGO_URL,
      imageAlt: 'Inventory'
    },
    {
      title: 'Track rentals & never lose gear',
      message: 'Use QR handoffs and reminders so everyone knows what’s out and what’s due back.',
      imageSrc: SKISTER_LOGO_URL,
      imageAlt: 'QR and reminders'
    },
    {
      title: 'Stay safe with condition checks & trust ratings',
      message: 'Confirm condition and leave ratings after returns to avoid disputes and build trust.',
      imageSrc: SKISTER_LOGO_URL,
      imageAlt: 'Condition and ratings'
    }
  ]
}

interface Slide {
  title: string
  message: string
  imageSrc?: string
  imageAlt: string
}
