/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
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
    },
  },
  plugins: [],
}
