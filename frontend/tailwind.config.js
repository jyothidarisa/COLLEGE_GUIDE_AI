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
        ivory: '#FFFCF4',
        cream: {
          DEFAULT: '#FFF8E8',
          light: '#FFFCF5',
          dark: '#F7EED7',
        },
        butter: {
          50: '#FFFEFA',
          100: '#FFFCEB',
          200: '#FFF8D4',
          300: '#FFF0B8', // Primary accent
          400: '#FCE496',
          500: '#F8D982', // Secondary accent / Gold
          600: '#ECC558',
          700: '#D4A433',
          800: '#9E771B',
          900: '#644A0D',
        },
        beige: {
          50: '#FDFCF9',
          100: '#F7F3EA',
          200: '#EAE2D1', // Borders: Pale beige
          300: '#DBD0BA',
          400: '#C2B499',
          500: '#A39478',
        },
        charcoal: {
          DEFAULT: '#38352D', // Primary text: Warm charcoal
          muted: '#777166',   // Secondary text: Muted brown-gray
          light: '#A19A8D',
          dark: '#24221D',
        },
        brand: {
          50: '#FFFCEB',
          100: '#FFF8D4',
          200: '#FFF0B8',
          300: '#FCE496',
          400: '#F8D982',
          500: '#F5CE68',
          600: '#ECC558',
          700: '#D4A433',
          800: '#9E771B',
          900: '#38352D',
        }
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(56, 53, 45, 0.05), 0 1px 2px rgba(56, 53, 45, 0.03)',
        'warm': '0 4px 12px rgba(56, 53, 45, 0.06), 0 1px 3px rgba(56, 53, 45, 0.04)',
        'warm-md': '0 8px 24px rgba(56, 53, 45, 0.08), 0 2px 6px rgba(56, 53, 45, 0.04)',
        'warm-lg': '0 16px 32px rgba(56, 53, 45, 0.10), 0 4px 12px rgba(56, 53, 45, 0.06)',
      }
    },
  },
  plugins: [],
}
