<script setup>
import { useSession } from '@/stores/session';
import { NCard } from 'naive-ui'

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NSpin, NButton } from 'naive-ui'
import GameBoard from '@/components/game/GameBoard.vue'
import GameSidebar from '@/components/game/GameSidebar.vue'
import GameControls from '@/components/game/GameControls.vue'
import EndGameDialog from '@/components/game/EndGameDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useSession } from '@/stores/session'
import {
    beginBoundary,
    cancelTurn,
    createGame,
    extendBoundary,
    finishPointTurn,
    getScores,
    placePoint,
} from '@/game/gameState'
import { resolvePlayerColor, resolveTurnColor } from '@/utils/session'
import { usePlayerName } from '@/composables/usePlayerName'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const sessionStore = useSession()

const game = ref(null)
const pageError = ref('')
const savingMove = ref(false)
const finalWinner = ref(null)
const session = computed(() => {
    const current = sessionStore.session.value
    return current ? normalizeSession(current) : null
})
const loading = computed(() => sessionStore.loading.value)

const creatorRef = computed(() => session.value?.creator ?? null)
const opponentRef = computed(() => session.value?.opponent ?? null)
const { name: creatorName } = usePlayerName(creatorRef)
const { name: opponentName } = usePlayerName(opponentRef)

const myColor = computed(() =>
    resolvePlayerColor(session.value, authStore.user?.id)
)
const currentPlayerColor = computed(() =>
    resolveTurnColor(session.value) || game.value?.currentPlayer || 'B'
)
const isMyTurn = computed(() => {
    if (!session.value?.turnPlayer || session.value.status !== 'PLAYING') return false
    return resolvePlayerColor(session.value, session.value.turnPlayer.id) === myColor.value
})
const gamePlayers = computed(() => {
    const scores = game.value ? getScores(game.value) : { B: 0, R: 0 }
    return [
        { name: creatorName.value, score: scores.B },
        { name: opponentName.value, score: scores.R },
    ]
})
const winner = computed(() => {
    const result = finalWinner.value || game.value?.winner
    if (result === 'TIE') return 'draw'
    if (result === 'B') return 0
    if (result === 'R') return 1
    return null
})

function normalizeSession(serverSession) {
    return {
        ...serverSession,
        status: serverSession.status === 'ACTIVE' ? 'PLAYING' : serverSession.status,
    }
}

function hydrateGame(serverSession) {
    const boardData = serverSession.board
    const size = Number.isInteger(boardData?.size) ? boardData.size : 8
    const emptyGame = createGame(size)
    const sourcePoints = boardData?.points
    const points = Array.isArray(sourcePoints) && sourcePoints.length
        ? sourcePoints.map(row => Array.isArray(row) ? row.join('') : row)
        : emptyGame.board

    if (points.length !== size + 1
        || points.some(row => typeof row !== 'string' || row.length !== size + 1)) {
        throw new Error('Сервер вернул игровое поле неверного размера')
    }

    const territories = (boardData?.territories || []).map((territory, index) => {
        const owner = territory.owner === serverSession.creator?.id
            ? 'B'
            : territory.owner === serverSession.opponent?.id
                ? 'R'
                : null
        if (!owner || !Array.isArray(territory.points)) {
            throw new Error('Сервер вернул некорректные данные территории')
        }
        return {
            id: index + 1,
            owner,
            boundary: territory.points.map(point => ({ x: point.x, y: point.y })),
        }
    })

    return {
        ...emptyGame,
        board: points,
        territories,
        currentPlayer: resolveTurnColor(serverSession) || 'B',
        status: serverSession.status === 'FINISHED' ? 'FINISHED' : 'PLAYING',
        nextTerritoryId: territories.length + 1,
    }
}

watch(
    session,
    serverSession => {
        if (!serverSession) return
        try {
            game.value = hydrateGame(serverSession)
            pageError.value = ''
        } catch (error) {
            pageError.value = error.message
        }
    },
    { immediate: true },
)

onMounted(async () => {
    try {
        await sessionStore.connect(String(route.params.id))
    } catch (error) {
        pageError.value = error.response?.data?.message || error.message || 'Не удалось загрузить игру'
    }
})

function serializeBoard(state) {
    return {
        size: state.size,
        points: state.board.map(row => [...row]),
        territories: state.territories.map(territory => ({
            owner: territory.owner === 'B'
                ? session.value.creator.id
                : session.value.opponent.id,
            points: territory.boundary.map(point => ({ x: point.x, y: point.y })),
        })),
    }
}

async function submitMove(nextGame) {
    const gameFinished = nextGame.status === 'FINISHED'
    if (gameFinished) finalWinner.value = nextGame.winner
    savingMove.value = true
    try {
        await sessionStore.move(serializeBoard(nextGame))
        if (gameFinished) await sessionStore.offer()
    } catch (error) {
        message.error(error.response?.data?.message || error.message || 'Не удалось сохранить ход')
        if (session.value) game.value = hydrateGame(session.value)
    } finally {
        savingMove.value = false
    }
}

async function onPointClick(x, y) {
    if (!game.value || !isMyTurn.value || savingMove.value) {
        if (!isMyTurn.value && session.value?.status === 'PLAYING') {
            message.warning('Сейчас ход соперника')
        }
        return
    }

    try {
        const current = game.value
        const color = current.board[y][x]
        let next

        if (current.pendingMove?.kind === 'boundary') {
            next = extendBoundary(current, x, y)
        } else if (current.pendingMove?.kind === 'point') {
            const placed = current.pendingMove.point
            if (placed.x === x && placed.y === y) {
                next = finishPointTurn(current)
            } else if (color === current.currentPlayer) {
                next = extendBoundary(beginBoundary(current, placed.x, placed.y), x, y)
            } else {
                throw new Error('Поставьте точку или продолжите стену своей точкой.')
            }
        } else if (color === '.') {
            next = placePoint(current, x, y)
        } else if (color === current.currentPlayer) {
            next = beginBoundary(current, x, y)
        } else {
            throw new Error('Можно начать стену только со своей точки.')
        }

        game.value = next
        if (!next.pendingMove) await submitMove(next)
    } catch (error) {
        message.error(error.message || 'Некорректный ход')
    }
}

function onUndo() {
    if (game.value?.pendingMove) game.value = cancelTurn(game.value)
}

async function onConfirmWall() {
    const start = game.value?.pendingMove?.path?.[0]
    if (start) await onPointClick(start.x, start.y)
}

async function onOfferEnd() {
    try {
        await sessionStore.offer()
    } catch (error) {
        message.error(error.response?.data?.message || error.message || 'Не удалось завершить игру')
    }
}

function onTimeout() {
    message.warning('Время на ход истекло')
}

function onCloseResult() {
    router.push({ name: 'Lobby' })
}
</script>

<template>
    <div class="online-game-page">
        <n-spin v-if="loading && !session" class="online-game-page__spin" />

        <n-alert v-else-if="pageError" type="error" :title="pageError" closable>
            <n-button quaternary @click="router.push({ name: 'Lobby' })">
                Вернуться в лобби
            </n-button>
        </n-alert>

        <div v-else-if="session?.status === 'WAITING'" class="online-game-page__waiting">
            <n-alert type="info" title="Ожидаем второго игрока">
                Игра появится на доске сразу после подключения соперника.
            </n-alert>
            <n-button @click="onOfferEnd">Отменить игру</n-button>
        </div>

        <div v-else-if="session && game" class="game-layout">
            <div class="game-layout__board">
                <GameBoard
                    :size="game.size"
                    :board="game.board"
                    :territories="game.territories"
                    :pending-move="game.pendingMove"
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
                    :can-undo="Boolean(game.pendingMove)"
                    :can-end="['PLAYING', 'OFFERING'].includes(session.status)"
                    :wall-building="game.pendingMove?.kind === 'boundary'"
                    :end-label="session.status === 'OFFERING' ? 'Принять завершение' : 'Предложить завершить игру'"
                    @undo="onUndo"
                    @confirm-wall="onConfirmWall"
                    @offer-end="onOfferEnd"
                />
                <n-button block quaternary @click="router.push({ name: 'Lobby' })">
                    ← В лобби
                </n-button>
            </div>
        </div>

        <EndGameDialog
            :show="session?.status === 'FINISHED'"
            :winner="winner"
            :players="gamePlayers"
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

.online-game-page__waiting {
    display: grid;
    justify-items: center;
    gap: 16px;
    padding: 48px 16px;
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
