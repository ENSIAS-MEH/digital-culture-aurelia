import { clsx } from 'clsx'

interface Props { className?: string }

export default function Skeleton({ className }: Props) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-aurelia-primary/10',
        className,
      )}
    />
  )
}
