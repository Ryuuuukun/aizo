import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/pages/HomePage.vue'),
        children: [
            {
                path: '',
                name: 'Menu',
                component: () => import('@/pages/MenuPage.vue'),
            },
            {
                path: 'me',
                name: 'Me',
                component: () => import('@/pages/MePage.vue'),
                meta: { requiresAuth: true },
            },
            {
                path: 'game',
                name: 'Game',
                component: () => import('@/pages/GamePage.vue'),
            },
            {
                path: 'online',
                name: 'Lobby',
                component: () => import('@/pages/LobbyPage.vue'),
                meta: { requiresAuth: false },
            },
            {
                path: 'online/:id',
                name: 'OnlineGame',
                component: () => import('@/pages/OnlineGamePage.vue'),
                meta: { requiresAuth: false },
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/pages/NotFound.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        authStore.login({ redirectUri: window.location.origin + to.fullPath })
        return false
    }
})

export default router