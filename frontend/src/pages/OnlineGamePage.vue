<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NSpin, NButton } from 'naive-ui'
import GameBoard from '@/components/game/GameBoard.vue'
import GameSidebar from '@/components/game/GameSidebar.vue'
import GameControls from '@/components/game/GameControls.vue'
import EndGameDialog from '@/components/game/EndGameDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { resolvePlayerColor } from '@/utils/session'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const session = ref(null)

const mockSession = {
    id: 'mock-uuid-1234',
    creator: { id: 'user-1', keycloak: 'kc-1' },
    opponent: { id: 'user-2', keycloak: 'kc-2' },
    turnPlayer: { id: 'user-1', keycloak: 'kc-1' },
    status: 'PLAYING',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    creatorRemainingMs: 300000,
    opponentRemainingMs: 300000,
    timeLimit: 300000,
    serverTime: new Date().toISOString(),
    board: Array.from({ length: 9 }, () => '.'.repeat(9)),
    size: 8,
    territories: [],
}

onMounted(() => {
    setTimeout(() => {
        session.value = mockSession
        loading.value = false
    }, 500)
})

const myColor = computed(() =>
    session.value ? resolvePlayerColor(session.value, authStore.user?.id) : null
)

const isMyTurn = computed(() =>
    session.value?.turnPlayer?.id === authStore.user?.id
)

const currentPlayerColor = computed(() =>
    session.value?.turnPlayer?.id === session.value?.creator?.id ? 'B' : 'R'
)

function onPointClick(x, y) {
    if (!isMyTurn.value) {
        console.warn('Сейчас не ваш ход')
        return
    }
    console.log('Клик по точке в онлайне:', x, y)
}

function onTimeout() {
    console.log('Время вышло в онлайне. Ждём бэк.')
}

function onOfferEnd() {
    console.log('Предложение завершить игру')
}

function onCloseResult() {
    router.push({ name: 'Lobby' })
}
</script>

<template>
    <div class="online-game-page">
        <n-spin v-if="loading" class="online-game-page__spin" />

        <div v-else-if="session" class="game-layout">
            <div class="game-layout__board">
                <GameBoard
                    :size="session.size"
                    :board="session.board"
                    :territories="session.territories"
                    :pending-move="null"
                    :current-player="currentPlayerColor"
                    :status="session.status"
                    @point-click="onPointClick"
                />
            </div>

            <div class="game-layout__side">
                <GameSidebar
                    :session="session"
                    :my-color="myColor"
                    @timeout="onTimeout"
                />
                <GameControls
                    :can-undo="false"
                    :can-end="session.status === 'PLAYING'"
                    :wall-building="false"
                    @offer-end="onOfferEnd"
                />
                <n-button block quaternary @click="router.push({ name: 'Lobby' })">
                    ← В лобби
                </n-button>
            </div>
        </div>

        <EndGameDialog
            :show="false"
            :winner="null"
            :players="[]"
            @close="onCloseResult"
        />
    </div>
</template>

<style lang="scss" scoped>
.online-game-page__spin {
    display: flex;
    justify-content: center;
    padding: 100px 0;
}

.game-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 28px;
    align-items: start;
    padding-top: 8px;

    &__side {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
}

@media (max-width: 900px) {
    .game-layout { grid-template-columns: 1fr; }
}
</style>