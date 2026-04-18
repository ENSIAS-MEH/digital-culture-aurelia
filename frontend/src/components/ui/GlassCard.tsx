import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export default function GlassCard({ children, className, onClick, hover }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-aurelia-primary/20 p-6',
        'backdrop-blur-[12px]',
        hover && 'cursor-pointer transition-all duration-200 hover:border-aurelia-primary/40 hover:shadow-[0_0_24px_rgba(124,58,237,0.2)]',
        className,
      )}
      style={{ background: 'rgba(124,58,237,0.07)' }}
    >
      {children}
    </div>
  )
}
