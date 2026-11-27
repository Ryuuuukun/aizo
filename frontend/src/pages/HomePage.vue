<script setup>
import { useAuthStore } from '@/stores/auth';
import { NButton } from 'naive-ui';

const authStore = useAuthStore();
</script>

<template>
    Home page
    <n-button @click="authStore.logout()">
        logout
    </n-button>
    <RouterLink :to="{ name: 'Home' }">
        To home
    </RouterLink>
    <RouterLink :to="{ name: 'Me' }">
        To me
    </RouterLink>
    <RouterView>

    </RouterView>
</template>
