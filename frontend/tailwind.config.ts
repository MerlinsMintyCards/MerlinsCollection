import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spriggatito: {
          50:  '#f2faf3',
          100: '#d4f0d9',
          200: '#a9e0b3',
          300: '#72c882',
          400: '#4aae5e',
          500: '#2d8f44',
          600: '#1f6e32',
          700: '#175427',
          800: '#103b1c',
          900: '#082110',
        },
        cream: '#f5f0e8',
      },
    },
  },
  plugins: [],
}

export default config
