import React, { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const rotate    = useTransform(scrollYProgress, [0, 1], [18, 0])
  const scale     = useTransform(scrollYProgress, [0, 1], isMobile ? [0.7, 0.9] : [1.04, 1])
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <div
      ref={containerRef}
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
    >
      <div className="py-10 md:py-40 w-full relative" style={{ perspective: '1000px' }}>
        {/* Title slides up as user scrolls */}
        <motion.div style={{ translateY }} className="max-w-5xl mx-auto text-center mb-4">
          {titleComponent}
        </motion.div>

        {/* 3‑D card */}
        <motion.div
          style={{
            rotateX: rotate,
            scale,
            background: '#0B0A1E',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow:
              '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 0 60px rgba(124,58,237,0.15)',
          }}
          className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full p-2 md:p-4 rounded-[30px]"
        >
          <div
            className="h-full w-full overflow-hidden rounded-2xl"
            style={{ background: '#06060F' }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
