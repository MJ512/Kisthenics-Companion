/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens map to CSS vars — use these in components
        bg:             'var(--color-background)',
        surface:        'var(--color-surface)',
        'surface-soft': 'var(--color-surface-soft)',
        'surface-el':   'var(--color-surface-elevated)',
        tp:             'var(--color-text-primary)',
        ts:             'var(--color-text-secondary)',
        tt:             'var(--color-text-tertiary)',
        border:         'var(--color-border)',
        divider:        'var(--color-divider)',
        primary:        'var(--color-primary)',
        'primary-h':    'var(--color-primary-hover)',
        'primary-soft': 'var(--color-primary-soft)',
        success:        'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',
        warning:        'var(--color-warning)',
        'warning-soft': 'var(--color-warning-soft)',
        error:          'var(--color-error)',
        'error-soft':   'var(--color-error-soft)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display': ['28px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title':   ['20px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline':['17px', { lineHeight: '1.3', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-lg': ['15px', { lineHeight: '1.47',letterSpacing: '-0.008em', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '-0.005em', fontWeight: '400' }],
        'micro':   ['11px', { lineHeight: '1.3', letterSpacing: '0.01em',   fontWeight: '500' }],
        'label':   ['12px', { lineHeight: '1.25',letterSpacing: '0.04em',   fontWeight: '600' }],
      },
      borderRadius: {
        'xs':   '5px',
        'sm':   '8px',
        'md':   '11px',
        'lg':   '14px',
        'xl':   '18px',
        '2xl':  '22px',
        'bubble': '24px',
        'pill': '9999px',
      },
      spacing: {
        'xxs': '4px',
        'xs':  '8px',
        'sm':  '12px',
        'md':  '17px',
        'lg':  '24px',
        'xl':  '32px',
        'xxl': '48px',
      },
      boxShadow: {
        'bubble': 'var(--bubble-shadow)',
        'card':   '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
        'modal':  '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      },
      animation: {
        'breathing': 'gentleBreathing 3.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
