import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aurelia: {
          bg:        '#06060F',
          surface:   '#0B0A1E',
          card:      '#110F27',
          primary:   '#7C3AED',
          secondary: '#D946EF',
          accent:    '#F59E0B',
          text:      '#F5F3FF',
          muted:     '#9090B0',
          subtle:    '#3D3B5E',
          success:   '#10B981',
          danger:    '#F43F5E',
          info:      '#06B6D4',
        },
      },
      fontFamily: {
        sans:    ['IBM Plex Sans', 'ui-sans-serif', 'system-ui'],
        heading: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'aurora-grad': `
          radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.18) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(217,70,239,0.13) 0%, transparent 60%),
          radial-gradient(ellipse at 60% 85%, rgba(245,158,11,0.06) 0%, transparent 60%)
        `,
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #D946EF)',
        'gradient-gold':    'linear-gradient(135deg, #F59E0B, #FBBF24)',
        'gradient-success': 'linear-gradient(135deg, #10B981, #34D399)',
        'gradient-danger':  'linear-gradient(135deg, #F43F5E, #FB7185)',
        'gradient-info':    'linear-gradient(135deg, #06B6D4, #38BDF8)',
      },
      boxShadow: {
        'glow-sm':      '0 0 14px rgba(124,58,237,0.30)',
        'glow-md':      '0 0 32px rgba(124,58,237,0.45)',
        'glow-lg':      '0 0 60px rgba(124,58,237,0.35)',
        'glow-fuchsia': '0 0 24px rgba(217,70,239,0.35)',
        'glow-gold':    '0 0 20px rgba(245,158,11,0.30)',
        'glow-success': '0 0 14px rgba(16,185,129,0.30)',
        'glow-danger':  '0 0 14px rgba(244,63,94,0.30)',
        'glow-info':    '0 0 14px rgba(6,182,212,0.30)',
        'card':         '0 4px 24px rgba(0,0,0,0.50)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.65)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'gradient-x': 'gradient-x 4s ease infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%':      { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
