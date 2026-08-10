/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './config/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      colors: {
        apex: {
          50: '#edf5ff',
          100: '#d9e6ff',
          200: '#b8ccff',
          300: '#89abff',
          400: '#5b84ff',
          500: '#345fff',
          600: '#2647db',
          700: '#1f3aac',
          800: '#1c2f83',
          900: '#18265f'
        }
      },
      boxShadow: {
        glow: '0 25px 80px rgba(15, 23, 42, 0.18)'
      }
    }
  },
  plugins: []
};
