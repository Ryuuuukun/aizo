<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<template>
    <div class="home">
        <AppHeader />
        <main class="home__content">
            <RouterView />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;

    &__content {
        flex: 1;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px;
    }
}
</style>