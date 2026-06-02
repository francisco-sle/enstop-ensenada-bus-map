/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Maritime Ensenada brand palette
        teal: {
          DEFAULT: '#3DBFA8',
          50:  '#EDFAF7',
          100: '#C5F1E9',
          200: '#8CE3D3',
          300: '#53D5BD',
          400: '#3DBFA8',
          500: '#2FA08C',
          600: '#218070',
          700: '#145F53',
          800: '#0B3F37',
          900: '#04201C',
        },
        amber: {
          DEFAULT: '#F0A030',
          50:  '#FEF9EE',
          100: '#FDEBC6',
          200: '#FAD58E',
          300: '#F7BF56',
          400: '#F0A030',
          500: '#D4831A',
          600: '#A86310',
          700: '#7C440A',
          800: '#502805',
          900: '#280F01',
        },
        navy: {
          DEFAULT: '#0F1E2E',
          50:  '#EBF0F5',
          100: '#C3D3E2',
          200: '#8AAABF',
          300: '#51809C',
          400: '#2A5578',
          500: '#1A3550',
          600: '#0F1E2E',
          700: '#0A1520',
          800: '#050D14',
          900: '#020508',
        },
        surface: {
          DEFAULT: '#1A2B3C',
          elevated: '#243446',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.25)',
        glow: '0 0 20px rgba(61,191,168,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '0.9' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.4s ease-out infinite',
        'fade-up':    'fade-up 0.25s ease-out',
        'slide-up':   'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}
