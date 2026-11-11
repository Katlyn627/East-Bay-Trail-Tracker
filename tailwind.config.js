/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1A4D3A',
          sky: '#4A90E2',
          earth: '#8B5E3C',
          amber: '#F7B733',
          sand: '#D2B48C',
          slate: '#555555',
          white: '#FFFFFF',
        },
        primary: '#1A4D3A',
        secondary: '#4A90E2',
        accent: '#F7B733',
        forest: '#1A4D3A',
        deepforest: '#1A4D3A',
        earth: '#8B5E3C',
        soil: '#8B5E3C',
        mist: '#F9FAF6',
        dark: '#555555',
        light: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
