export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        neucha: ['Neucha', 'cursive'],
        'patrick-hand': ['Patrick Hand', 'cursive'],
        montserratAlt: ["'Montserrat Alternates'", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(15deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(15deg)' },
          '80%': { transform: 'rotate(-5deg)' },
          '100%': { transform: 'rotate(0)' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.1' }
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        progress: 'progressBar 3.5s linear forwards',
        wave: 'wave 1.5s infinite',
        blink: 'blink 1.2s infinite'
      },
    }
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
};
