const colors = require('tailwindcss/colors');
const tailwindScrollbar = require('tailwind-scrollbar');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      gridTemplateColumns: {
        // Auto-fit grid min 400px
        'fit-400': 'repeat(auto-fit, minmax(400px, 1fr))',
      },
      colors: {
        sky: colors.sky,
        cyan: colors.cyan,
      },
      animation: {
        'spin-slow-reverse': 'spin-slow-reverse 8s linear infinite',
      },
      keyframes: {
        'spin-slow-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [tailwindScrollbar({ nocompatible: true })],
};
