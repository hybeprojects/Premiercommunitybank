/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#0ea5e9',
          DEFAULT: '#0284c7',
          dark: '#0369a1'
        }
      }
    }
  },
  plugins: []
};
