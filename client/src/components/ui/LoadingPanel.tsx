import { useEffect, useState } from 'react'
import preloaderOne from '../../assets/preloaders/preloader-1.gif'
import preloaderTwo from '../../assets/preloaders/preloader-2.gif'
import preloaderThree from '../../assets/preloaders/preloader-3.gif'

interface Preloader {
  src: string
  width: number
  height: number
}

// Natural dimensions, declared so the slot doesn't resize while the file loads.
const PRELOADERS: readonly Preloader[] = [
  { src: preloaderOne, width: 64, height: 64 },
  { src: preloaderTwo, width: 64, height: 64 },
  { src: preloaderThree, width: 140, height: 21 },
]

const LINE_INTERVAL_MS = 6000

interface LoadingPanelProps {
  id: string
  title: string
  /** Cycled every six seconds, then held on the last. */
  lines: readonly string[]
}

/** Shown while something slow and paid-for runs. Shared, so both waits match. */
export function LoadingPanel({ id, title, lines }: LoadingPanelProps) {
  // Drawn once per mount. A pick made during render would deal a new spinner on
  // every re-render and strobe all three.
  const [preloader] = useState(
    () => PRELOADERS[Math.floor(Math.random() * PRELOADERS.length)],
  )
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    // Clamped rather than looping: a long run shouldn't restate line one. Once
    // it holds, the identical value bails out of re-rendering by itself.
    const id = setInterval(
      () => setLineIndex((current) => Math.min(current + 1, lines.length - 1)),
      LINE_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [lines.length])

  return (
    <section className="analysis-progress" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>

      <span className="analysis-progress__slot">
        <img src={preloader.src} width={preloader.width} height={preloader.height} alt="" />
      </span>

      {/* The caller's status region announces once; a line changing every few
          seconds would interrupt a screen reader for the whole run. */}
      <p className="analysis-progress__line" aria-hidden="true">
        {lines[lineIndex]}
      </p>
    </section>
  )
}
