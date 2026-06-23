/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // QistPY brand identity (brief Phase 2 — different from EasyQist)
        primary: {
          DEFAULT: '#2346A0',
          dark: '#17307A',
          50: '#EEF2FB',
          100: '#D6DFF5',
          200: '#AFC0EB',
          300: '#879FE1',
          400: '#5C7ED0',
          500: '#2346A0',
          600: '#1E3E8F',
          700: '#17307A',
          800: '#112465',
          900: '#0B1A4F',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        success: '#16A34A',
        ink: '#0F172A',
        muted: '#64748B',
        canvas: '#F8FAFC',
        border: '#E2E8F0',
      },
      fontFamily: {
        // Brief Phase 2: Plus Jakarta Sans for headings, Inter for body
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};
