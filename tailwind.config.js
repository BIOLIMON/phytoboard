/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0b1620',
        surface:  '#111e2d',
        surface2: '#172638',
        surface3: '#1d3048',
        border:   '#1e3347',
        border2:  '#264459',
        green:    '#4ade80',
        cyan:     '#38bdf8',
        blue:     '#60a5fa',
        yellow:   '#fde047',
        red:      '#f87171',
        muted:    '#5a7a96',
        'ph-text':'#d8eaf7',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      animation: {
        float:     'float 6s ease-in-out infinite',
        pulse_dot: 'pulse_dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
