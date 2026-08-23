import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'neo-orange': '#F2843B',
        'neo-dark': '#1E1B18',
        'neo-light': '#F5F4F1',
      },
    },
  },
  plugins: [],
}
export default config
