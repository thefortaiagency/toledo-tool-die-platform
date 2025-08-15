/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Toledo Tool & Die brand colors
        toledo: {
          orange: '#f97316', // Primary orange
          slate: '#64748b',  // Secondary grey
          dark: '#1e293b',   // Dark slate
          light: '#f8fafc',  // Light background
        },
        // Semantic colors for the app
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(222.2, 84%, 4.9%)',
        },
        muted: {
          DEFAULT: 'hsl(210, 40%, 96.1%)',
          foreground: 'hsl(215.4, 16.3%, 46.9%)',
        },
      },
    },
  },
  plugins: [],
}