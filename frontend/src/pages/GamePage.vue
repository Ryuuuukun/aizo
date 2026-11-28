<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    NAlert,
    NButton,
    NCard,
    NFlex,
    NForm,
    NFormItem,
    NInputNumber,
    NSelect,
} from 'naive-ui'
import { useGameStore } from '@/stores/game'

import GameBoard from '@/components/game/GameBoard.vue'
import GameSidebar from '@/components/game/GameSidebar.vue'
import GameControls from '@/components/game/GameControls.vue'
import EndGameDialog from '@/components/game/EndGameDialog.vue'

const router = useRouter()
const store = useGameStore()

const size = ref(8)
const started = ref(false)
const difficulty = ref('random')
const isComputerThinking = ref(false)
let computerTurnTimer = null

const difficultyOptions = [
    { label: 'Случайная', value: 'random' },
    { label: 'Сложная', value: 'hard' },
    { label: 'Монте-Карло', value: 'monte-carlo' },
]

onMounted(() => {
    if (store.isFinished) store.reset()
})

onUnmounted(() => {
    if (computerTurnTimer !== null) window.clearTimeout(computerTurnTimer)
})

function start(mode = 'local') {
    try {
        store.newGame({ size: size.value, mode, difficulty: difficulty.value })
        started.value = true
    } catch (error) {
        store.error = error.message
    }
}

function scheduleComputerTurn() {
    if (store.mode !== 'computer'
        || store.currentPlayer !== 'R'
        || store.pendingMove
        || store.isFinished
        || isComputerThinking.value) {
        return
    }

    isComputerThinking.value = true
    computerTurnTimer = window.setTimeout(() => {
        computerTurnTimer = null
        let turnTaken = false
        try {
            turnTaken = store.playComputerTurn()
        } catch (error) {
            store.error = error.message
        } finally {
            isComputerThinking.value = false
            if (turnTaken
                && store.mode === 'computer'
                && store.currentPlayer === 'R'
                && !store.pendingMove
                && !store.isFinished) {
                scheduleComputerTurn()
            }
        }
    }, 400)
}

function onOfferEnd() {
    if (isComputerThinking.value) return
    store.offerEnd()
}

function onPointClick(x, y) {
    if (isComputerThinking.value) return
    store.handlePointClick(x, y)
    scheduleComputerTurn()
}

function onAgain() {
    start(store.mode)
}

function onCloseResult() {
    store.reset()
    router.push({ name: 'Menu' })
}
</script>

<template>
    <div>
        <n-alert
            v-if="store.error"
            type="error"
            closable
            class="game-error"
            @close="store.clearError()"
        >
            {{ store.error }}
        </n-alert>

        <n-card v-if="!started" title="Новая игра" class="setup-card">
            <n-form>
                <n-form-item label="Размер поля (4–20)">
                    <n-input-number v-model:value="size" :min="4" :max="20" />
                </n-form-item>
                <n-form-item label="Сложность компьютера">
                    <n-select v-model:value="difficulty" :options="difficultyOptions" />
                </n-form-item>
            </n-form>
            <n-flex justify="end">
                <n-button @click="start('local')">Начать локальную игру</n-button>
                <n-button type="primary" @click="start('computer')">
                    Играть с компьютером
                </n-button>
            </n-flex>
        </n-card>

        <div v-else class="game-layout">
            <n-alert
                v-if="isComputerThinking"
                type="info"
                :show-icon="false"
                class="computer-status"
            >
                Компьютер думает…
            </n-alert>

            <div class="game-layout__board">
                <GameBoard
                    :size="store.size"
                    :board="store.board"
                    :territories="store.territories"
                    :pending-move="store.pendingMove"
                    :current-player="store.currentPlayer"
                    :status="store.game.status"
                    @point-click="onPointClick"
                />
            </div>

            <div class="game-layout__side">
                <GameSidebar />
                <GameControls
                    :can-undo="!isComputerThinking && store.canUndo"
                    :can-end="!isComputerThinking && store.canEndGame"
                    :wall-building="store.isWallBuilding"
                    @undo="store.undoMove"
                    @cancel-wall="store.cancelWall"
                    @confirm-wall="store.confirmWall"
                    @offer-end="onOfferEnd"
                />
                <n-button block quaternary @click="router.push({ name: 'Menu' })">
                    ← В меню
                </n-button>
            </div>
        </div>

        <EndGameDialog
            :show="store.isFinished"
            :winner="store.winner"
            :players="store.players"
            @again="onAgain"
            @close="onCloseResult"
        />
    </div>
</template>

<style lang="scss" scoped>
.game-error {
    margin-bottom: 16px;
}

.setup-card {
    max-width: 520px;
    margin: 40px auto;
    box-shadow: 0 8px 32px rgba(74, 108, 247, .08);
}

.computer-status {
    grid-column: 1 / -1;
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