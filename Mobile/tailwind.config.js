const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#f59e0b',
          teal: '#0d9488',
          dark: '#111111',
          card: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#888888',
        }
      },
      borderWidth: {
        hairline: hairlineWidth(),
      }
    }
  },
  plugins: []
}
