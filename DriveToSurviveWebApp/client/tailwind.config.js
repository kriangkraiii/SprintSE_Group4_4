export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#137FEC', 
        secondary: '#fff',
        cta: '#137FEC',           
        'cta-hover': '#145ee7ff',
        'cta-light': '#E0F2FE',   
        surface: '#F9FAFB',
      },
      fontFamily: {
        heading: ['Kanit', 'sans-serif'],
        body: ['Kanit', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
}