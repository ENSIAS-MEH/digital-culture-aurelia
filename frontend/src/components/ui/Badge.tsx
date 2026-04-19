interface Props {
  label: string
  color?: string
  size?: 'sm' | 'md'
}

export default function Badge({ label, color = '#7c3aed', size = 'md' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'}`}
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  )
}
