export const Colors = {
  bg:        '#06060F',
  surface:   '#0B0A1E',
  card:      '#110F27',
  cardBorder: 'rgba(124,58,237,0.18)',
  primary:   '#7C3AED',
  secondary: '#D946EF',
  accent:    '#F59E0B',
  text:      '#F5F3FF',
  muted:     '#9090B0',
  subtle:    '#3D3B5E',
  success:   '#10B981',
  danger:    '#F43F5E',
  info:      '#06B6D4',
} as const

export const Gradients = {
  primary: ['#7C3AED', '#D946EF'] as const,
  gold:    ['#F59E0B', '#FBBF24'] as const,
  success: ['#10B981', '#34D399'] as const,
  danger:  ['#F43F5E', '#FB7185'] as const,
}
