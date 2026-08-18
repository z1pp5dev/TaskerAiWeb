/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tasker: {
          bg: '#090d16',
          surface: '#131b2e',
          'surface-variant': '#1e293b',
          'surface-card': '#162035',
          border: '#2a3b5c',
          outline: '#384d75',
          primary: '#a855f7', // Bold Purple Primary (matching 0xFFD0BCFF / Accent)
          'primary-hover': '#9333ea',
          'primary-container': '#3b1861',
          'on-primary-container': '#e9d5ff',
          secondary: '#38bdf8', // Electric Cyan
          'secondary-container': '#0c4a6e',
          accent: '#10b981', // Emerald
          text: '#f8fafc',
          'text-muted': '#94a3b8',
          'text-dim': '#64748b'
        },
        priority: {
          low: {
            bg: '#082f49',
            text: '#7dd3fc',
            border: '#0284c7'
          },
          medium: {
            bg: '#451a03',
            text: '#fde047',
            border: '#d97706'
          },
          high: {
            bg: '#431407',
            text: '#fb923c',
            border: '#ea580c'
          },
          urgent: {
            bg: '#450a0a',
            text: '#fca5a5',
            border: '#dc2626'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
