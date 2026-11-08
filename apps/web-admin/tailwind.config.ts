import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F7FF',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#6C3CE9',
          primary: '#6C3CE9',
          dark: '#4C1D95',
          soft: '#EDE9FE',
        },
        'accent-yellow': '#FACC15',
        'accent-mint': '#10B981',
        text: {
          primary: '#1E1B4B',
          secondary: '#64748B',
          muted: '#94A3B8',
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
    },
  },
  plugins: [],
};

export default config;
