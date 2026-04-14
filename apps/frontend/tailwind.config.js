/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        panel: {
          DEFAULT: 'rgb(var(--color-panel) / <alpha-value>)',
          muted: 'rgb(var(--color-panel-muted) / <alpha-value>)',
          elevated: 'rgb(var(--color-panel-elevated) / <alpha-value>)',
          inverse: 'rgb(var(--color-panel-inverse) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        border: {
          soft: 'rgb(var(--color-border-soft) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
          inverse: 'rgb(var(--color-border-inverse) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          emphasis: 'rgb(var(--color-accent-emphasis) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--color-accent-contrast) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          soft: 'rgb(var(--color-info-soft) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        panel: 'var(--shadow-panel)',
        lift: 'var(--shadow-lift)',
        inset: 'var(--shadow-inset)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        display: ['var(--font-family-display)'],
        mono: ['var(--font-family-mono)'],
      },
      backgroundImage: {
        'page-grid': 'var(--background-grid)',
        'page-glow': 'var(--background-glow)',
      },
      spacing: {
        gutter: 'var(--layout-gutter)',
        section: 'var(--layout-section-gap)',
        container: 'var(--layout-container-max)',
      },
      transitionDuration: {
        micro: 'var(--motion-duration-micro)',
        swift: 'var(--motion-duration-swift)',
        smooth: 'var(--motion-duration-smooth)',
        settle: 'var(--motion-duration-settle)',
      },
      transitionTimingFunction: {
        standard: 'var(--motion-ease-standard)',
        emphasized: 'var(--motion-ease-emphasized)',
        decelerated: 'var(--motion-ease-decelerated)',
      },
    },
  },
  plugins: [],
}
