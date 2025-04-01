/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#001a1a',
          50: '#f0fafa',
          100: '#d0f0f0',
          200: '#a0e0e0',
          300: '#70d0d0',
          400: '#40c0c0',
          500: '#20b0b0',
          600: '#109090',
          700: '#007070',
          800: '#005050',
          900: '#003030',
          950: '#001a1a',
        },
        accent: {
          DEFAULT: '#ffd700',
          50: '#fffbeb',
          100: '#fff4c6',
          200: '#ffe985',
          300: '#ffdb4d',
          400: '#ffd700', // Primary accent color
          500: '#e6c200',
          600: '#cca900',
          700: '#b39200',
          800: '#997b00',
          900: '#806600',
          950: '#665200',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};