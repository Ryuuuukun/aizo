import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/pages/HomePage.vue'),
        meta: {
            requiresAuth: false
        },
        children: [
            {
                path: '/me',
                name: 'Me',
                component: () => import('@/pages/MePage.vue'),
                meta: {
                    requiresAuth: true
                }
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        authStore.login({ redirectUri: window.location.origin + to.fullPath });
        return false;
    }
});

export default router;
