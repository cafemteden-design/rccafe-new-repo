/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        'bg-soft': '#f7f7f5',
        text: '#1b1b1b',
        muted: '#666666',
        orange: {
          DEFAULT: '#ff6b1a',
          50: '#fff4ed',
          100: '#ffe6d4',
          200: '#ffc7a3',
          300: '#ffa872',
          400: '#ff8941',
          500: '#ff6b1a',
          600: '#d94f00',
          700: '#a93e00',
          800: '#7a2c00',
          900: '#4d1c00'
        },
        charcoal: {
          DEFAULT: '#151515',
          50: '#3a3a3a',
          100: '#2a2a2a',
          200: '#1f1f1f',
          300: '#151515'
        },
        border: '#e8e2dc'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 6px 24px rgba(20,20,20,0.06)',
        card: '0 12px 32px rgba(20,20,20,0.08)',
        glow: '0 10px 30px rgba(255,107,26,0.25)'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  },
  plugins: []
}
