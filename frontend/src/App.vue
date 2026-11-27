<script setup>
import { RouterView } from 'vue-router'
import {
    NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider,
    ruRU, dateRuRU,
} from 'naive-ui'
import { onMounted, onUnmounted } from 'vue'

import { socket } from '@/api/websocket.js'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

const themeOverrides = {
    common: {
        primaryColor: '#4a6cf7',
        primaryColorHover: '#3b5bdb',
        primaryColorPressed: '#2c4bc7',
        primaryColorSuppl: '#4a6cf7',
        borderRadius: '10px',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
    Button: { borderRadiusMedium: '10px', fontWeight: '500' },
    Card:   { borderRadius: '16px', paddingMedium: '20px 24px' },
    Input:  { borderRadius: '10px' },
    Dialog: { borderRadius: '16px' },
}

onMounted(async () => {
    socket.authTokenProvider = async () => {
        if (!authStore.isAuthenticated || !authStore.keycloak) return null
        try {
            await authStore.keycloak.updateToken(30)
            return authStore.token
        } catch (e) {
            console.error('Failed to refresh Keycloak token for WebSocket', e)
            return null
        }
    }
    await socket.connect()
})

onUnmounted(async () => {
    await socket.disconnect()
})
</script>

<template>
    <NConfigProvider :locale="ruRU" :date-locale="dateRuRU" :theme-overrides="themeOverrides">
        <NMessageProvider>
            <NDialogProvider>
                <NNotificationProvider>
                    <RouterView />
                </NNotificationProvider>
            </NDialogProvider>
        </NMessageProvider>
    </NConfigProvider>
</template>