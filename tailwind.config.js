/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#2D5A27',
          deep: '#1B3618',
          light: '#4F7942',
          moss: '#8A9A5B',
        },
        poppy: {
          DEFAULT: '#FF8C00',
          light: '#FFA500',
        },
        lupine: {
          DEFAULT: '#6A5ACD',
          light: '#9370DB',
        },
        earth: {
          DEFAULT: '#3E2723',
          clay: '#8D6E63',
          sand: '#D2B48C',
        },
        sage: {
          DEFAULT: '#F0F4F0',
          mist: '#E8F5E9',
        },
        gold: '#FFD700',
        brand: {
          primary: '#2D5A27',
          secondary: '#3E2723',
          accent: '#FF8C00',
        }
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        organic: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        'organic': '2rem',
        'leaf-tl': '2rem 0.5rem 2rem 0.5rem',
        'leaf-tr': '0.5rem 2rem 0.5rem 2rem',
      },
      backgroundImage: {
        'forest-gradient': "linear-gradient(135deg, #2D5A27 0%, #1B3618 100%)",
        'poppy-gradient': "linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)",
        'nature-pattern': "url('https://www.transparenttextures.com/patterns/leaves.png')",
      }
    },
  },
  plugins: [],
};
