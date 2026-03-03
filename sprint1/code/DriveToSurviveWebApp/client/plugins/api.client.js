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
          ? { data: b.data, pagination: b.pagination }   
          : b.data                                       
      }
    },

    onResponseError({ response }) {
      let body = response?._data
      if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch { }
      }

      const msg =
        body?.message ||
        body?.error?.message ||
        body?.error ||
        response?.statusText ||
        'Request failed'

      throw createError({
        statusCode: response?.status || 500,
        statusMessage: msg,
        data: body,
      })
    },
  })

  return { provide: { api } }
})
