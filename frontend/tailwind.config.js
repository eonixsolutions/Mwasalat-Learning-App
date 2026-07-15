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

        // ── Mwasalat brand (matches the real Mwasalat Oman identity —
        // deep red road-network mark + near-black wordmark). Scoped to
        // Mwasalat-prefixed files only; `tealBrand`/`coral` above remain
        // the untouched Eonix theme. ──────────────────────────────────
        mwasalatRed: {
          700: '#8C1622',
          600: '#B31E2E',
          500: '#D6293C',
          400: '#E24A5A',
          300: '#EFA0AA',
          100: '#FDEBED',
        },
        mwasalatInk: {
          500: '#23181A',
          400: '#4A3336',
          300: '#8C6B6E',
          200: '#D9C9CA',
          100: '#F6EFEF',
        },
      },

      // ── Gradients ─────────────────────────────────────────────
      backgroundImage: {
        'gradient-hero': 'linear-gradient(90deg, #D96C5F, #7C6AF2)',
        'gradient-soft': 'linear-gradient(135deg, #FBE9E7, #F3E8FF)',
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
