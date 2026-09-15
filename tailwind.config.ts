import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'neo-orange': '#F2843B',
        'neo-dark': '#1E1B18',
        'neo-light': '#F5F4F1',
        'neo-lilac': '#E4CFF2',
        'neo-lilac-dark': '#8B5CB8',
      },
    },
  },
  plugins: [],
}
export default config
