/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sunu-red': '#B50303',
        'sunu-red-hover': '#910202',
        'sunu-gray-light': '#F5F5F5',
        'sunu-gray-dark': '#333333',
        'sunu-gray-neutral': '#E5E5E5',
      },
      fontFamily: {
        'title': ['Poppins', 'Montserrat', 'sans-serif'],
        'body': ['Roboto', 'Open Sans', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'sunu': '0 4px 6px -1px rgba(181, 3, 3, 0.1), 0 2px 4px -1px rgba(181, 3, 3, 0.06)',
      },
    },
  },
  plugins: [],
}