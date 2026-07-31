/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0B0F19', // Very deep blue/black
          800: '#111827', // Slate
          700: '#1F2937', // Light slate
        },
        primary: '#38bdf8', // Light blue
        accent: '#818cf8', // Indigo
      }
    },
  },
  plugins: [],
}
