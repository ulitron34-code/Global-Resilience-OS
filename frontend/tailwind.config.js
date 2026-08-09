/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A1120',
        panel: '#101B2E',
        raised: '#152238',
        line: '#22334E',
        signal: {
          DEFAULT: '#2DD4BF',
          dim: '#1B7A6E',
          glow: '#5EEAD4',
        },
        alert: {
          DEFAULT: '#FB923C',
          dim: '#9A5220',
          glow: '#FDBA74',
        },
        ink: {
          DEFAULT: '#E7ECF5',
          muted: '#8B98B4',
          dim: '#4A5872',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        signal: '0 0 24px rgba(45, 212, 191, 0.35)',
        alert: '0 0 24px rgba(251, 146, 60, 0.4)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        scan: 'scan 3s linear infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '100%': { transform: 'scale(3.2)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

