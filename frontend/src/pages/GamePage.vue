<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NCard, NForm, NFormItem, NInputNumber, NButton, NFlex } from 'naive-ui'
import { useGameStore } from '@/stores/game'
import { onMounted} from 'vue'

import GameBoard from '@/components/game/GameBoard.vue'
import GameSidebar from '@/components/game/GameSidebar.vue'
import GameControls from '@/components/game/GameControls.vue'
import EndGameDialog from '@/components/game/EndGameDialog.vue'

const router = useRouter()
const message = useMessage()
const store = useGameStore()

const size = ref(8)
const started = ref(false)

onMounted(() => {
    if (store.isFinished) store.reset()
})


function start() {
    store.newGame({ size: size.value, mode: 'local' })
    started.value = true
}

function onOfferEnd() {
    store.offerEnd()
}

function onCellClick(x, y) {
    store.handleCellClick(x, y)
}

function onPointClick(x, y) {
    store.handlePointClick(x, y)
}

function onAgain() {
    start()
}

function onCloseResult() {
    store.reset()
    router.push({ name: 'Menu' })
}
</script>

<template>
    <div>
        <n-card v-if="!started" title="Новая локальная игра" class="setup-card">
            <n-form>
                <n-form-item label="Размер поля (4–20)">
                    <n-input-number v-model:value="size" :min="4" :max="20" />
                </n-form-item>
            </n-form>
            <n-flex justify="end">
                <n-button type="primary" @click="start">Начать игру</n-button>
            </n-flex>
        </n-card>

        <div v-else class="game-layout">
            <div class="game-layout__board">
                <GameBoard
                    :size="store.size"
                    @cell-click="onCellClick"
                    @point-click="onPointClick"
                    @cancel-wall="store.cancelWall"
                    @confirm-wall="() => {}"
                />
            </div>

            <div class="game-layout__side">
                <GameSidebar />
                <GameControls
                    :can-undo="store.canUndo"
                    :can-end="store.canEndGame"
                    :wall-building="store.isWallBuilding"
                    @undo="store.undoMove"
                    @cancel-wall="store.cancelWall"
                    @confirm-wall="() => {}"
                    @offer-end="onOfferEnd"
                />
                <n-button block quaternary @click="router.push({ name: 'Menu' })">
                    ← В меню
                </n-button>
            </div>
        </div>

        <!-- Результат -->
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
.setup-card {
    max-width: 520px;
    margin: 40px auto;
    box-shadow: 0 8px 32px rgba(74, 108, 247, .08);
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