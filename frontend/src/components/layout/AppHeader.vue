<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { NButton, NAvatar } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { displayName } from '@/utils/user'

const authStore = useAuthStore()
const router = useRouter()

const userName = computed(() => displayName(authStore.user))
const initials = computed(() => {
    const parts = userName.value.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

function goMe() {
    router.push({ name: 'Me' })
}
</script>

<template>
    <header class="app-header">
        <RouterLink :to="{ name: 'Menu' }" class="app-header__brand">
            <span class="app-header__logo-mark">●</span>
            <span class="app-header__logo-text">Точки</span>
        </RouterLink>

        <nav class="app-header__nav">
            <RouterLink :to="{ name: 'Menu' }" class="app-header__link">Меню</RouterLink>
            <RouterLink :to="{ name: 'Game' }" class="app-header__link">Локальная</RouterLink>
            <RouterLink :to="{ name: 'Lobby' }" class="app-header__link">Онлайн</RouterLink>
        </nav>

        <div class="app-header__user">
            <template v-if="authStore.isAuthenticated">
                <div class="app-header__user-info" @click="goMe">
                    <n-avatar round size="small">{{ initials }}</n-avatar>
                    <span class="app-header__user-name">{{ userName }}</span>
                </div>
                <n-button size="small" quaternary @click="authStore.logout()">Выйти</n-button>
            </template>
            <n-button v-else size="small" type="primary" @click="authStore.login()">Войти</n-button>
        </div>
    </header>
</template>

<style lang="scss" scoped>
.app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 0 32px;
    height: 64px;
    background: rgba(255, 255, 255, .85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, .06);
    color: #1e1e2e;
}

.app-header__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
    font-weight: 700;
    font-size: 18px;
}

.app-header__logo-mark {
    color: #4a6cf7;
    font-size: 22px;
    line-height: 1;
}

.app-header__nav {
    display: flex;
    gap: 4px;
    flex: 1;
}

.app-header__link {
    padding: 8px 14px;
    border-radius: 8px;
    color: #6b7280;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: background .15s, color .15s;

    &:hover { background: #f3f4f6; color: #1e1e2e; }
    &.router-link-active { background: #eef2ff; color: #4a6cf7; }
}

.app-header__user {
    display: flex;
    align-items: center;
    gap: 12px;
}

.app-header__user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px 10px 4px 4px;
    border-radius: 999px;
    transition: background .15s;

    &:hover { background: #f3f4f6; }
}

.app-header__user-name {
    font-size: 14px;
    font-weight: 500;
}
</style>