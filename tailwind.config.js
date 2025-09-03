/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 10px 25px -10px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}