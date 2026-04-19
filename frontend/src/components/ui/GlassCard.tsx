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
        hover ? 'glass-card-hover' : 'glass-card',
        'p-6',
        hover && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
