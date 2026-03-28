import { useEffect, useRef } from 'react'

const GlobalCursor = () => {
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const enabled = typeof window !== 'undefined' && window.matchMedia('(pointer:fine)').matches

  useEffect(() => {
    if (!enabled) {
      return
    }

    document.body.classList.add('custom-cursor-active')

    return () => {
      document.body.classList.remove('custom-cursor-active')
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const dot = cursorDotRef.current
    const ring = cursorRingRef.current

    if (!dot || !ring) {
      return
    }

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let frame = 0

    const onMouseMove = (event) => {
      mx = event.clientX
      my = event.clientY
    }

    const animate = () => {
      dot.style.left = `${mx}px`
      dot.style.top = `${my}px`
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = `${rx}px`
      ring.style.top = `${ry}px`
      frame = window.requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMouseMove)
    frame = window.requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.cancelAnimationFrame(frame)
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return (
    <>
      <div className="cursor" aria-hidden="true">
        <div className="cursor-dot" ref={cursorDotRef} />
      </div>
      <div className="cursor-ring" ref={cursorRingRef} aria-hidden="true" />
    </>
  )
}

export default GlobalCursor
