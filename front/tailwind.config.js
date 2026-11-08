/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#142B43',
          secondary: '#1D3B56',
          dark: '#0E1F31',
          light: '#244766',
        },
        teal: {
          DEFAULT: '#176B76',
          hover: '#135861',
          light: '#E8F3F4',
          subtle: '#F0F7F8',
        },
        steel: {
          DEFAULT: '#60758A',
          hover: '#4D5E70',
          light: '#EEF2F6',
          muted: '#8A9BA8',
        },
        brand: {
          bg: '#F4F6F8',
          surface: '#FFFFFF',
          'surface-hover': '#F8FAFC',
          border: '#DCE3E9',
          'border-light': '#E9EFF4',
        },
        text: {
          primary: '#1D2939',
          secondary: '#667085',
          muted: '#98A2B3',
          light: '#F8FAFC',
        },
        status: {
          success: '#27856F',
          'success-bg': '#EAF5F2',
          'success-border': '#B7E2D6',
          warning: '#D99A35',
          'warning-bg': '#FDF6EB',
          'warning-border': '#F5DCB4',
          critical: '#C94C4C',
          'critical-bg': '#FDF2F2',
          'critical-border': '#F3C5C5',
          info: '#176B76',
          'info-bg': '#E8F3F4',
          'info-border': '#B8DFE3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'kpi': ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'page-title': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'section-title': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'card-title': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
        'dropdown': '0 4px 12px -2px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
        'drawer': '-4px 0 16px 0 rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};
