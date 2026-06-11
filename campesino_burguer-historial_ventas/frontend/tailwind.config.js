/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--accent)',
        background: 'var(--background)',
        foreground: 'var(--ink)',
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: '#fff',
        },
        secondary: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--ink)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#fff',
        },
        muted: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--ink-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent-subtle)',
          foreground: 'var(--accent)',
        },
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--ink)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(4px)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        'fade-out': 'fade-out 100ms ease-in',
        'scale-in': 'scale-in 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        'scale-out': 'scale-out 100ms ease-in',
      },
    },
  },
  plugins: [],
};
