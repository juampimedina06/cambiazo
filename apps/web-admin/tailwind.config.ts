import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        brand: {
          DEFAULT: '#6C3CE9',
          primary: '#6C3CE9',
          dark: 'rgb(var(--brand-dark-rgb) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft-rgb) / <alpha-value>)',
        },
        'accent-yellow': '#FACC15',
        'accent-mint': '#10B981',
        text: {
          primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        status: {
          warning: '#F97316',
          danger: '#EF4444',
          success: '#10B981',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(30, 27, 75, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)',
        'glass-dark': '0 12px 40px -10px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
