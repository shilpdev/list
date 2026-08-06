import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueList from '@7span/vue-list'
import vueListConfig from './api/vue-list-config'

const app = createApp(App)
app.use(router)
app.use(VueList, {
  componentPrefix: '',
  ...vueListConfig,
})
app.mount('#app')
