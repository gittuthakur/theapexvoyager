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
        // The "professional royal/indigo blue" accent for the light theme. Every
        // primary button / active tab / badge across the app uses apex-500 as ITS
        // main shade (not apex-600), so apex-500 itself is set to Tailwind's own
        // blue-600 hex (#2563eb) — every bg-apex-500/text-apex-300/shadow-apex-500
        // usage site-wide picks this up automatically; nothing else needs touching.
        apex: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554'
        }
      },
      boxShadow: {
        glow: '0 25px 80px rgba(15, 23, 42, 0.18)'
      }
    }
  },
  plugins: []
};
