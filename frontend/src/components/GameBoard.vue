<script setup>
import { computed, ref } from 'vue';
import {
    beginBoundary,
    cancelTurn,
    extendBoundary,
    finishGame,
    finishPointTurn,
    getScores,
    placePoint
} from '@/game/gameState';

const props = defineProps({
    initialState: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['restart']);
const game = ref(props.initialState);
const error = ref('');
const step = 40;
const margin = 30;
const viewSize = computed(() => game.value.size * step + margin * 2);
const scores = computed(() => getScores(game.value));
const currentPlayerName = computed(() =>
    game.value.currentPlayer === 'B' ? 'Чёрные' : 'Красные');
const movePath = computed(() => game.value.pendingMove?.kind === 'boundary'
    ? game.value.pendingMove.path
    : []);
const hint = computed(() => {
    if (game.value.pendingMove?.kind === 'point') {
        return 'Нажмите на точку ещё раз, чтобы передать ход, или на соседнюю свою точку, чтобы начать стену.';
    }
    if (game.value.pendingMove?.kind === 'boundary') {
        return 'Продолжайте стену по соседним точкам и нажмите на начальную точку, чтобы замкнуть её.';
    }
    return 'Поставьте точку или выберите существующую свою точку, чтобы начать стену.';
});

const pointPosition = ({ x, y }) => ({
    x: margin + x * step,
    y: margin + y * step
});

const boundaryPoints = boundary => boundary
    .map(point => {
        const position = pointPosition(point);
        return `${position.x},${position.y}`;
    })
    .join(' ');

function clickPoint(x, y) {
    if (game.value.status !== 'PLAYING') return;
    error.value = '';
    const current = game.value;
    const color = current.board[y][x];

    try {
        if (current.pendingMove?.kind === 'boundary') {
            game.value = extendBoundary(current, x, y);
            return;
        }

        if (current.pendingMove?.kind === 'point') {
            const placed = current.pendingMove.point;
            if (placed.x === x && placed.y === y) {
                game.value = finishPointTurn(current);
                return;
            }
            if (color === current.currentPlayer) {
                game.value = extendBoundary(beginBoundary(current, placed.x, placed.y), x, y);
                return;
            }
            throw new Error('Поставьте точку или продолжите стену своей точкой.');
        }

        if (color === '.') {
            game.value = placePoint(current, x, y);
        } else if (color === current.currentPlayer) {
            game.value = beginBoundary(current, x, y);
        } else {
            throw new Error('Можно начать стену только со своей точки.');
        }
    } catch (moveError) {
        error.value = moveError.message;
    }
}

function undoTurn() {
    game.value = cancelTurn(game.value);
    error.value = '';
}

function endGame() {
    if (game.value.pendingMove?.kind === 'boundary') {
        error.value = 'Сначала завершите или отмените стену.';
        return;
    }
    if (!window.confirm('Оба игрока согласны завершить игру?')) return;
    game.value = finishGame(game.value);
    error.value = '';
}
</script>

<template>
    <section class="game">
        <header class="game__status">
            <div>
                <strong v-if="game.status === 'PLAYING'">{{ currentPlayerName }} ходят</strong>
                <strong v-else-if="game.winner === 'TIE'">Ничья</strong>
                <strong v-else>Победили {{ game.winner === 'B' ? 'чёрные' : 'красные' }}</strong>
                <span v-if="game.status === 'PLAYING'" class="game__hint">{{ hint }}</span>
            </div>
            <div class="game__scores">
                <span>Чёрные: {{ scores.B }}</span>
                <span>Красные: {{ scores.R }}</span>
            </div>
        </header>

        <p v-if="error" class="game__error" role="alert">{{ error }}</p>

        <div class="game__board-wrap">
            <svg
                class="game__board"
                :viewBox="`0 0 ${viewSize} ${viewSize}`"
                role="img"
                aria-label="Игровое поле"
            >
                <g class="game__grid">
                    <line
                        v-for="index in game.size + 1"
                        :key="`vertical-${index}`"
                        :x1="margin + (index - 1) * step"
                        :y1="margin"
                        :x2="margin + (index - 1) * step"
                        :y2="viewSize - margin"
                    />
                    <line
                        v-for="index in game.size + 1"
                        :key="`horizontal-${index}`"
                        :x1="margin"
                        :y1="margin + (index - 1) * step"
                        :x2="viewSize - margin"
                        :y2="margin + (index - 1) * step"
                    />
                </g>

                <polygon
                    v-for="territory in game.territories"
                    :key="territory.id"
                    :points="boundaryPoints(territory.boundary)"
                    :class="['game__territory', `game__territory--${territory.owner}`]"
                />
                <polyline
                    v-if="movePath.length > 1"
                    :points="boundaryPoints(movePath)"
                    class="game__draft"
                />

                <g v-for="(row, y) in game.board" :key="`row-${y}`">
                    <circle
                        v-for="(color, x) in row"
                        :key="`${x}-${y}`"
                        :cx="margin + x * step"
                        :cy="margin + y * step"
                        :r="color === '.' ? 11 : 7"
                        :class="[
                            'game__point',
                            color === '.' ? 'game__point--empty' : `game__point--${color}`
                        ]"
                        :tabindex="game.status === 'PLAYING' ? 0 : -1"
                        role="button"
                        :aria-label="`Точка ${x}, ${y}${color === '.' ? ', свободна' : `, ${color === 'B' ? 'чёрная' : 'красная'}`}`"
                        @click="clickPoint(x, y)"
                        @keydown.enter="clickPoint(x, y)"
                        @keydown.space.prevent="clickPoint(x, y)"
                    />
                </g>
            </svg>
        </div>

        <footer class="game__actions">
            <button
                type="button"
                :disabled="!game.pendingMove || game.status !== 'PLAYING'"
                @click="undoTurn"
            >
                Отменить ход
            </button>
            <button
                v-if="game.status === 'PLAYING'"
                type="button"
                @click="endGame"
            >
                Завершить игру
            </button>
            <button v-else type="button" @click="emit('restart')">
                Новая игра
            </button>
        </footer>
    </section>
</template>

<style scoped>
.game {
    display: grid;
    gap: 1rem;
}

.game__status,
.game__actions,
.game__scores {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.game__status > div:first-child {
    display: grid;
    gap: 0.3rem;
}

.game__hint {
    color: #555;
    font-size: 0.9rem;
}

.game__scores {
    flex-wrap: wrap;
    justify-content: flex-end;
    font-variant-numeric: tabular-nums;
}

.game__error {
    margin: 0;
    color: #b42318;
}

.game__board-wrap {
    width: min(100%, 760px);
    margin: 0 auto;
}

.game__board {
    display: block;
    width: 100%;
    height: auto;
    touch-action: manipulation;
}

.game__grid line {
    stroke: #d3d3d3;
    stroke-width: 1;
}

.game__territory {
    stroke-width: 4;
    fill-opacity: 0.12;
}

.game__draft {
    fill: none;
    stroke: #3574c8;
    stroke-width: 3;
    stroke-dasharray: 6 5;
    pointer-events: none;
}

.game__point {
    cursor: pointer;
    outline: none;
}

.game__actions button {
    padding: 0.5rem 0.75rem;
}

@media (max-width: 520px) {
    .game__status,
    .game__actions {
        align-items: flex-start;
        flex-direction: column;
    }

    .game__scores {
        justify-content: flex-start;
    }
}
</style>
