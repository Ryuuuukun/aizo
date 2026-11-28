import App from './App.vue';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui'
import '@/assets/styles/global.scss'


import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(naive)

const authStore = useAuthStore();
await authStore.initAuth();

app.use(router);
app.mount('#app');

// authStore.initAuth().then(() => {
//     app.use(router);
//     app.mount('#app');
// });