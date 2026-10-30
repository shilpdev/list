// Nuxt UI registers everything we need (icons, fonts, color mode) as part of its module.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-26',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
})
