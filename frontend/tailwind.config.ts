import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aurelia: {
          bg:        '#0d0a1a',
          surface:   '#1a1040',
          primary:   '#7c3aed',
          secondary: '#a855f7',
          accent:    '#f59e0b',
          text:      '#f1f0f9',
          muted:     '#6b7280',
          success:   '#10b981',
          danger:    '#ef4444',
        },
      },
      fontFamily: {
        sans:     ['Inter', 'ui-sans-serif', 'system-ui'],
        heading:  ['Sora', 'ui-sans-serif', 'system-ui'],
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
}

export default config
