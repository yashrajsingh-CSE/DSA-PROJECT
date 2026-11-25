/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF' }, secondary: '#0F172A', ink: '#1E293B', muted: '#64748B', success: '#16A34A', danger: '#DC2626' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
