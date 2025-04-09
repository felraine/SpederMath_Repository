export default { 
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        neucha: ['Neucha', 'cursive'],
        'patrick-hand': ['Patrick Hand', 'cursive'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        progress: 'progressBar 3.5s linear forwards'
      },
    }    
  },
  plugins: [],
};
