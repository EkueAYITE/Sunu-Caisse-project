/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  /** @type {import('tailwindcss').Config} */
  theme: {
    extend: {
      colors: {
        'sunu-red': '#c73535',
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
        borderRadius: {
          xl: "1rem",
          '2xl': "1.5rem",
        },
        boxShadow: {
          sunu: "0 4px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    plugins: [],
  };

