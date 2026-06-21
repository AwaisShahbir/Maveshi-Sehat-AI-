/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fbf6',
          100: '#e3f7ec',
          200: '#cbf0da',
          300: '#a3e2be',
          400: '#72cd9b',
          500: '#4cb880',
          600: '#389968',
          700: '#2e7c56',
          800: '#276246',
          900: '#21513b',
          950: '#0e2d20',
        }
      }
    },
  },
  plugins: [],
}
