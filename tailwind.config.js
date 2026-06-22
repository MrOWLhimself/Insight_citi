/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        orange: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c' },
        ink: { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827' },
      },
      typography: {
        inkwell: {
          css: {
            '--tw-prose-body': '#2d2d2d',
            '--tw-prose-headings': '#111',
            '--tw-prose-links': '#f97316',
            '--tw-prose-quote-borders': '#f97316',
          }
        }
      }
    },
  },
  plugins: [],
}
