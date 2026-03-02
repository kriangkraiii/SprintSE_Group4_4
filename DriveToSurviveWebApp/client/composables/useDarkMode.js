/**
 * Dark Mode Composable
 * Manages dark mode state with localStorage persistence
 */
import { ref, watch, onMounted } from 'vue'

const isDarkMode = ref(false)

function applyTheme(dark) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export function useDarkMode() {
  onMounted(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      isDarkMode.value = saved === 'true'
    } else {
      isDarkMode.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
    }
    applyTheme(isDarkMode.value)
  })

  function toggle() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', String(isDarkMode.value))
    applyTheme(isDarkMode.value)
  }

  watch(isDarkMode, (val) => {
    applyTheme(val)
  })

  return { isDarkMode, toggle }
}
