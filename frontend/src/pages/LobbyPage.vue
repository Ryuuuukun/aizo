<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
    NCard, NButton, NInput, NFlex, NPagination, useMessage,
} from 'naive-ui'
import { useLobbyStore } from '@/stores/lobby'
import { useAuthStore } from '@/stores/auth'
import { useCreateGameDialog } from '@/composables/useCreateGameDialog.js'
import GameList from '@/components/lobby/GameList.vue'
import { useSessionSevice } from '@/api/services/session'

const router = useRouter()
const message = useMessage()
const lobby = useLobbyStore()
const authStore = useAuthStore()
const createDialog = useCreateGameDialog()

const service = useSessionSevice()

const page = ref(1)
const totalPages = ref(1)
const sessions = ref([])
const loading = ref(false)
const filteredSessions = computed(() => {
    const queryText = lobby.query.trim().toLowerCase()
    return queryText
        ? sessions.value.filter(session => (session.name || '').toLowerCase().includes(queryText))
        : sessions.value
})

onMounted(async () => {
    await onRefresh();
});
watch(page, onRefresh)

const query = computed({
    get: () => lobby.query,
    set: (v) => lobby.setQuery(v),
})

async function onCreate() {
    const data = await createDialog.open()
    if (!data) return

    try {
        const session = await service.create(data)

        message.success('Игра создана')
        router.push({ name: 'OnlineGame', params: { id: session.id } })
    } catch (e) {
        message.error(e.response?.data?.message || e.message || 'Не удалось создать игру')
    }
}

async function onJoin(id) {
    try {
        const session = await service.join(id)
        router.push({ name: 'OnlineGame', params: { id: session.id } })
    } catch (e) {
        message.error(e.response?.data?.message || e.message || 'Не удалось присоединиться')
    }
}

async function onRefresh() {
    if (!authStore.isAuthenticated) return
    loading.value = true
    try {
        const data = await service.waiting({ size: 6, page: page.value - 1 })
        totalPages.value = Math.max(data.totalPages || 1, 1)
        sessions.value = data.content || []
    } catch (e) {
        message.error(e.response?.data?.message || e.message || 'Не удалось загрузить список игр')
    } finally {
        loading.value = false
    }
}
</script>

<template>

    <n-card title="Онлайн-игры" class="lobby">
        <n-flex vertical size="large">
            <n-flex justify="space-between" align="center" wrap>
                <n-input
                    v-model:value="query"
                    placeholder="Поиск по названию игры"
                    clearable
                    style="max-width: 360px;"
                />
                <n-flex size="small">
                    <n-button quaternary :loading="loading" @click="onRefresh">Обновить</n-button>
                    <n-button type="primary" @click="onCreate">Создать игру</n-button>
                </n-flex>
            </n-flex>

            <GameList
                :games="filteredSessions"
                :loading="loading"
                @join="onJoin"
            />

            <n-flex v-if="totalPages > 1" justify="center">
                <n-pagination
                    v-model:page="page" :page-count="totalPages"
                />
            </n-flex>
        </n-flex>
    </n-card>
</template>

<style lang="scss" scoped>
.lobby {
    max-width: 920px;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .05);
}
</style>