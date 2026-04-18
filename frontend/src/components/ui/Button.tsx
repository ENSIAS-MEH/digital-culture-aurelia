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
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurelia-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-aurelia-bg',
        'active:scale-[0.97] cursor-pointer select-none',
        fullWidth && 'w-full',
        variant === 'primary' && [
          'px-5 py-2.5 text-sm text-white',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100',
        ],
        variant === 'ghost' && [
          'px-4 py-2 text-sm text-aurelia-text',
          'border border-aurelia-primary/25 hover:border-aurelia-primary/50',
          'hover:bg-aurelia-primary/10 hover:shadow-glow-sm',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        ],
        variant === 'danger' && [
          'px-4 py-2 text-sm text-white',
          'bg-gradient-to-r from-aurelia-danger to-pink-500',
          'hover:shadow-glow-danger hover:-translate-y-px',
        ],
        className,
      )}
      style={variant === 'primary' && !(disabled || loading) ? {
        background: 'linear-gradient(135deg, #7C3AED, #D946EF)',
        boxShadow: '0 0 0 0 transparent',
      } : undefined}
      onMouseEnter={e => {
        if (variant === 'primary' && !(disabled || loading)) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 0 22px rgba(124,58,237,0.55), 0 0 44px rgba(217,70,239,0.20)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        if (variant === 'primary') {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 transparent'
          ;(e.currentTarget as HTMLButtonElement).style.transform = ''
        }
      }}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white shrink-0" />
      )}
      {children}
    </button>
  )
}
