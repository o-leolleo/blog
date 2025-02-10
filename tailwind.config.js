/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./content/**/*.md",
    "./layouts/**/*.html",
    "./assets/js/**/*.js"
  ],
  plugins: [
    require('@tailwindcss/typography')
  ],
  theme: {
    extend: {
      transitionProperty: {
        'max-height': 'max-height',
      },
    },
  },
}
