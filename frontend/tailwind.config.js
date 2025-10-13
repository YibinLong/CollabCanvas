/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind where to look for classes in your code
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors for the design tool theme
      colors: {
        canvas: {
          bg: '#1e1e1e',      // Dark canvas background
          grid: '#2a2a2a',    // Grid lines
          light: '#f5f5f5',   // Light mode canvas
        },
        toolbar: {
          bg: '#252525',      // Toolbar background
          hover: '#333333',   // Hover state
        },
      },
      // Custom animations for smooth interactions
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

