import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ONBOARDING_DONE_KEY = 'onboarding_v1_done'

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
      className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">{slide.title}</h1>
          <p className="text-sm text-muted-foreground">{slide.message}</p>
        </div>

        {slide.imageSrc ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-muted/20">
            <img src={slide.imageSrc} alt={slide.imageAlt} className="h-56 w-full object-contain" />
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2" aria-label="Onboarding progress">
          {slides.map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={[
                'h-2 w-2 rounded-full',
                i === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              ].join(' ')}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeIndex === 0}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-semibold disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            {primaryLabel}
          </button>
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
      imageSrc: '/assets/Skister Mascot.png',
      imageAlt: 'Skister mascot'
    },
    {
      title: 'List your gear → others can borrow it',
      message: 'Add gear to your inventory so your network can request it.',
      imageSrc: '/assets/Skister Mascot.png',
      imageAlt: 'Inventory'
    },
    {
      title: 'Track rentals & never lose gear',
      message: 'Use QR handoffs and reminders so everyone knows what’s out and what’s due back.',
      imageSrc: '/assets/Skister Mascot.png',
      imageAlt: 'QR and reminders'
    },
    {
      title: 'Stay safe with condition checks & trust ratings',
      message: 'Confirm condition and leave ratings after returns to avoid disputes and build trust.',
      imageSrc: '/assets/Skister Mascot.png',
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

