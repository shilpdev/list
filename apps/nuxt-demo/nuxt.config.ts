// Nuxt UI registers icons and color mode as part of its module. Its bundled @nuxt/fonts is turned
// off because it self-hosts font files; fonts load from the Google Fonts CDN instead.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-26',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  ui: { fonts: false },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..700&family=Google+Sans+Code:wght@400..700&display=swap',
        },
      ],
    },
  },
})
