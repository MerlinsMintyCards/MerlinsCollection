import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '380px',
        nav: '860px',
        wide: '900px',
      },
      colors: {
        spriggatito: {
          50: '#f2faf3', 100: '#d4f0d9', 200: '#a9e0b3', 300: '#72c882',
          400: '#4aae5e', 500: '#2d8f44', 600: '#1f6e32', 700: '#175427',
          800: '#103b1c', 900: '#082110',
        },
        forest: { DEFAULT: '#1f6e32', deep: '#103b1c', mid: '#2d8f44' },
        mint: { DEFAULT: '#a9e0b3', soft: '#d4f0d9' },
        cream: '#f2eede',
        paper: '#cfe1b4',
        ink: '#241f1b',
        muted: '#6f6457',
        line: '#e6ddcc',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 14px 30px rgba(16,59,28,0.12)',
        'card-lg': '0 22px 44px rgba(16,59,28,0.30)',
      },
    },
  },
  plugins: [],
}

export default config
