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
        primary: '#1E4D40', // Dark Green
        secondary: '#334155',
        cta: {
          DEFAULT: '#EAB308', // Gold
          hover: '#CA8A04',
          light: '#FEF9C3', // Light Gold/Yellow
        },
        surface: '#F9FAFB',
      },
      fontFamily: {
        heading: ['Lexend', 'sans-serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
}