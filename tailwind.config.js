/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D5A27',
        secondary: '#1B4332',
        accent: '#FFB703',
        forest: '#2D5A27',
        deepforest: '#1B4332',
        earth: '#5C4033',
        soil: '#8B5A2B',
        mist: '#F4F6F0',
        dark: '#243127',
        light: '#F4F6F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
