<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    NCard, NButton, NInput, NFlex, NPagination, useMessage, NTag
} from 'naive-ui'
import { useLobbyStore } from '@/stores/lobby'
import { useCreateGameDialog } from '@/composables/useCreateGameDialog.js'
import GameList from '@/components/lobby/GameList.vue'
import { useSessionSevice } from '@/api/services/session'

const router = useRouter()
const message = useMessage()
const lobby = useLobbyStore()
const createDialog = useCreateGameDialog()

const service = useSessionSevice();

const page = ref(0);
const total = ref(0);
const sessions = ref([]);

const activeSession = ref(null);
const loadingActive = ref(false);

onMounted(async () => {
    await onRefresh();
});

const query = computed({
    get: () => lobby.query,
    set: (v) => lobby.setQuery(v),
})

async function onCreate() {
    const data = await createDialog.open()
    if (!data) return

    try {
        const session = await service.create(data);
        message.success('Игра создана');
        router.push({ name: 'OnlineGame', params: { id: session.id } });
    } catch (e) {
        message.error(e.message || 'Не удалось создать игру');
    }
}

async function onJoin(id) {
    try {
        await service.join(id);
        router.push({ name: 'OnlineGame', params: { id } });  
    } catch (e) {
        message.error(e.message || 'Не удалось присоединиться');
    }
}

async function onRefresh() {
    loadingActive.value = true;
    try {
        const active = await service.active();
        if (active && active.id && active.status !== 'FINISHED') {
            activeSession.value = active;
        } else {
            activeSession.value = null;
        }
    } catch (e) {
        activeSession.value = null;
    } finally {
        loadingActive.value = false;
    }

    try {
        const data = await service.waiting({ page: page.value });
        total.value = data.totalPages;
        sessions.value = data.content;
    } catch (e) {
        message.error(e.message || 'Произошла непредвиденная ошибка');
    }
}

function goToActiveGame() {
    if (activeSession.value) {
        router.push({ name: 'OnlineGame', params: { id: activeSession.value.id } });
    }
}
</script>

<template>
    <n-flex vertical size="large">
        <n-card 
            v-if="activeSession" 
            title="Ваша активная игра" 
            class="lobby active-game-card"
            :bordered="false"
        >
            <n-flex align="center" justify="space-between" wrap>
                <div>
                    <p style="margin: 0 0 8px; font-weight: 600;">
                        Вы уже находитесь в игре
                        <n-tag size="small" :type="activeSession.status === 'WAITING' ? 'warning' : 'success'">
                            {{ activeSession.status === 'WAITING' ? 'Ожидание соперника' : 'Игра идет' }}
                        </n-tag>
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        ID игры: {{ activeSession.id?.slice(0, 8) || 'Неизвестно' }}...
                    </p>
                </div>
                <n-button type="primary" size="large" @click="goToActiveGame">
                    Вернуться в игру
                </n-button>
            </n-flex>
        </n-card>

        <n-card title="Доступные игры" class="lobby">
            <n-flex vertical size="large">
                <n-flex justify="space-between" align="center" wrap>
                    <n-input
                        v-model:value="query"
                        placeholder="Поиск по названию игры"
                        clearable
                        style="max-width: 360px;"
                    />
                    <n-flex size="small">
                        <n-button quaternary @click="onRefresh">Обновить</n-button>
                        <n-button type="primary" @click="onCreate">Создать игру</n-button>
                    </n-flex>
                </n-flex>

                <!-- ЗАГЛУШКА -->
                <pre style="background: #f5f7fb; padding: 16px; border-radius: 8px; overflow: auto; font-size: 12px;">{{ sessions }}</pre>

                <!-- 
                <GameList
                    :games="sessions"
                    :loading="loading"
                    @join="onJoin"
                />
                -->

                <n-flex v-if="total > 1" justify="center">
                    <n-pagination
                        v-model:page="page" :page-count="total"
                        @update:page="onRefresh"
                    />
                </n-flex>
            </n-flex>
        </n-card>
    </n-flex>
</template>

<style lang="scss" scoped>
.lobby {
    max-width: 920px;
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .05);
}

.active-game-card {
    max-width: 920px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
    border: 1px solid #dbe4ff;
}
</style>