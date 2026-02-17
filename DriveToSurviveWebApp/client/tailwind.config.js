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
        primary: '#236993', // Dark Green
        secondary: '#fff',
        cta: {
          DEFAULT: '#fff', // Gold
          hover: '#CA8A04',
          light: '#FEF9C3', // Light Gold/Yellow
        },
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