/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors derived from the Stitch designs
        brand: {
          50:  '#eef4fb',
          100: '#d6e4f4',
          200: '#a8c5e7',
          300: '#73a0d6',
          400: '#3d7bc4',
          500: '#1f5fac',
          600: '#0a4595',   // primary deep blue used everywhere
          700: '#083877',
          800: '#062b59',
          900: '#04203f',
        },
        accent: {
          green: '#16a34a',
          greenSoft: '#dcfce7',
          peach: '#fde2dc',
          peachStrong: '#dc2626',
          lavender: '#e8e1ff',
          sky: '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 1px 6px rgba(15,23,42,.06)',
      },
    },
  },
  plugins: [],
};
