/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          950: '#1e1b4b',
        },
        indigo: {
          950: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
}

