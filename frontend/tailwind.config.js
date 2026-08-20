/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#080d11',
        petrol: {
          DEFAULT: '#0c3438',
          2: '#11525a',
        },
        champagne: {
          DEFAULT: '#c6a66a',
          glow: 'rgba(198, 166, 106, 0.25)',
        },
        aqua: {
          DEFAULT: '#43b8c4',
          glow: 'rgba(67, 184, 196, 0.25)',
        },
        ivory: '#f4f1ea',
        void: '#080d11',
        panel: '#0c171a',
        raised: 'rgba(255, 255, 255, 0.035)',
        line: 'rgba(255, 255, 255, 0.11)',
        signal: {
          DEFAULT: '#43b8c4',
          dim: '#11525a',
          glow: 'rgba(67, 184, 196, 0.4)',
        },
        alert: {
          DEFAULT: '#c6a66a',
          dim: '#9c7f46',
          glow: 'rgba(198, 166, 106, 0.4)',
        },
        ink: {
          DEFAULT: '#f4f1ea',
          muted: '#a8b3b9',
          dim: '#68767d',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Inter', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        signal: '0 0 24px rgba(67, 184, 196, 0.35)',
        alert: '0 0 24px rgba(198, 166, 106, 0.4)',
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
