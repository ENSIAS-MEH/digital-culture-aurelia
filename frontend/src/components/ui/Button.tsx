import { ReactNode, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

export default function Button({
  children, variant = 'primary', loading, fullWidth, className, disabled, ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-aurelia-primary/60 focus:ring-offset-2 focus:ring-offset-aurelia-bg',
        'active:scale-95 cursor-pointer',
        fullWidth && 'w-full',
        variant === 'primary' && [
          'px-5 py-2.5 text-white',
          'bg-gradient-to-r from-aurelia-primary to-indigo-600',
          'hover:shadow-[0_0_16px_rgba(124,58,237,0.5)] hover:-translate-y-px',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
        ],
        variant === 'ghost' && [
          'px-4 py-2 text-aurelia-text border border-aurelia-primary/30',
          'hover:bg-aurelia-primary/10 hover:border-aurelia-primary/60',
        ],
        variant === 'danger' && [
          'px-4 py-2 text-white bg-aurelia-danger/80',
          'hover:bg-aurelia-danger',
        ],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {children}
    </button>
  )
}
