import { useCookie } from '#app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',

    async onRequest({ options }) {
      const token = useCookie('token').value
      if (token) {
        // ใช้ Headers object เพื่อไม่ให้ override Content-Type ที่ browser set ให้ FormData
        const h = new Headers(options.headers)
        h.set('Authorization', `Bearer ${token}`)
        options.headers = h
      }
    },

    onResponse({ response }) {
      const b = response._data
      if (b && typeof b === 'object' && Object.prototype.hasOwnProperty.call(b, 'data')) {
        response._data = Object.prototype.hasOwnProperty.call(b, 'pagination')
          ? { data: b.data, pagination: b.pagination, ...(b.session && { session: b.session }) }
          : b.data
      }
    },

    onResponseError({ response }) {
      let body = response?._data
      if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch { }
      }

      const status = response?.status

      // 401 → token ไม่ถูกต้อง (e.g. server restart) → ล้าง session แล้ว redirect login
      if (status === 401 && process.client) {
        const token = useCookie('token')
        const user = useCookie('user')
        token.value = null
        user.value = null
        try { localStorage.removeItem('token') } catch { }
        // redirect ไป login (avoid infinite loop ถ้าอยู่ที่ login อยู่แล้ว)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
          return
        }
      }

      const msg =
        body?.message ||
        body?.error?.message ||
        body?.error ||
        response?.statusText ||
        'Request failed'

      throw createError({
        statusCode: status || 500,
        statusMessage: msg,
        data: body,
      })
    },
  })

  return { provide: { api } }
})
