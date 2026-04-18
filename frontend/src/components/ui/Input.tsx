import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, icon, className, id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-aurelia-text/80">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aurelia-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-lg bg-aurelia-surface border border-aurelia-primary/30 px-4 py-2.5',
              'text-aurelia-text placeholder-aurelia-muted text-sm',
              'focus:outline-none focus:ring-2 focus:ring-aurelia-primary/60 transition-all duration-200',
              icon && 'pl-10',
              error && 'border-aurelia-danger/60 focus:ring-aurelia-danger/40',
              className,
            )}
            {...rest}
          />
        </div>
        {error && <p className="text-xs text-aurelia-danger">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
