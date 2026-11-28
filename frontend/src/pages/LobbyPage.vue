<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    NCard, NButton, NInput, NFlex, NPagination, useMessage,
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

onMounted(async () => {
    await onRefresh();
});

const query = computed({
    get: () => lobby.query,
    set: (v) => lobby.setQuery(v),
})

async function onCreate() {
    const session = await service.create({ size: 10 });

    message.success('Игра создана');
    router.push({ name: 'OnlineGame', params: { id: session.id } });
    // const data = await createDialog.open()
    // if (!data) return

    // try {
    //     const session = await service.create(data);

    //     message.success('Игра создана');
    //     router.push({ name: 'OnlineGame', params: { id: session.id } });
    // } catch (e) {
    //     message.error(e.message || 'Не удалось создать игру');
    // }
}

async function onJoin(id) {
    // try {
    //     await lobby.joinGame(id)
    //     router.push({ name: 'OnlineGame', params: { id } })
    // } catch (e) {
    //     message.error(e.message || 'Не удалось присоединиться')
    // }
}

async function onRefresh() {
    try {
        const data = await service.waiting({ page: page.value });
        total.value = data.totalPages;
        sessions.value = data.content;
    } catch (e) {
        message.error(e.message || 'Произошла непредвиденная ошибка');
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
                    <n-button quaternary @click="onRefresh">Обновить</n-button>
                    <n-button type="primary" @click="onCreate">Создать игру</n-button>
                </n-flex>
            </n-flex>

            <!-- <GameList
                
                :games="lobby.pagedGames"
                :loading="lobby.loading"
                @join="onJoin"
            /> -->

            {{
                sessions
            }}

            <n-flex v-if="total > 1" justify="center">
                <n-pagination
                    v-model:page="page" :page-count="total"
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