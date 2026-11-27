import App from './App.vue';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);


const authStore = useAuthStore();
authStore.initAuth().then(() => {
    app.use(router);
    app.mount('#app');
});
