/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        peacock: {
          blue: '#0E5A8A',
          teal: '#0F9D9A',
          cyan: '#22D3EE',
        },
        light: {
          bg: '#F4FBFC',
          surface: '#FFFFFF',
          text: '#0B2A3C',
          border: '#D6EEF2',
        },
        dark: {
          bg: '#061A24',
          surface: '#0B2B3A',
          text: '#E6F7FA',
          border: '#134356',
        }
      }
    },
  },
  plugins: [],
}
