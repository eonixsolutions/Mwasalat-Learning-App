/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Teal Brand (logo, icons, structural UI, sidebar) ──────
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        tealBrand: {
          500: '#1F5E63',
          400: '#2F7A80',
          300: '#5FA3A8',
          200: '#A7D1D4',
          100: '#E6F4F5',
        },

        // ── Coral (primary action color — buttons, CTAs, highlights) ──
        coral: {
          700: '#A94E43',
          600: '#C45E52',
          500: '#D96C5F',
          300: '#F2B3AC',
          100: '#FBE9E7',
        },

        // ── Accent (icons, progress, charts, graphs) ──────────────
        accent: {
          purple: '#7C6AF2',
          orange: '#F59E0B',
          green:  '#22C55E',
        },
      },

      // ── Gradients ─────────────────────────────────────────────
      backgroundImage: {
        'gradient-hero': 'linear-gradient(90deg, #D96C5F, #7C6AF2)',
        'gradient-soft': 'linear-gradient(135deg, #FBE9E7, #F3E8FF)',
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
