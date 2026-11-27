<script setup>
import { RouterView } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';

import { socket } from '@/api/websocket.js';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
    socket.authTokenProvider = async () => {
        if (!authStore.isAuthenticated || !authStore.keycloak) {
            return null;
        }

        try {
            const refreshed = await authStore.keycloak.updateToken(30);
            if (refreshed) {
                authStore.token = authStore.keycloak.token;
            }

            return authStore.token;
        } catch (e) {
            console.error('Failed to refresh Keycloak token for WebSocket', e);
            return null;
        }
    };

    await socket.connect();
});

onUnmounted(async () => {
    await socket.disconnect();
});
</script>

<template>
    <RouterView/>
</template>
