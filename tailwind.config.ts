import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.4s ease both',
        'slide-up':    'slideUp 0.35s ease both',
        'skeleton':    'skeleton 1.5s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-sm':     '0 0 10px rgba(124, 58, 237, 0.2)',
        'card-hover':  '0 12px 40px -8px rgba(124, 58, 237, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
