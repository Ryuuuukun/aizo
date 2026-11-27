<script setup>
import { useAuthService } from '@/api/services/auth';
import { useAuthStore } from '@/stores/auth';

import { onMounted, ref } from 'vue';

const authStore = useAuthStore();
const authService = useAuthService();

const serverStore = ref(null);

onMounted(async () => {
    serverStore.value = await authService.me();
});
</script>

<template>
    <p>Me page</p>
    <p>User: {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
    <p>Server id: {{ serverStore?.id }}</p>
    <p>Keycloak id: {{ serverStore?.keycloak }}</p>
</template>
