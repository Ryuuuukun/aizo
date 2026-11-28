<script setup>
import { computed } from 'vue'

const props = defineProps({
    size: { type: Number, required: true },
    board: { type: Array, required: true },
    territories: { type: Array, required: true },
    treasures: { type: Array, default: () => [] },
    pendingMove: { type: Object, default: null },
    currentPlayer: { type: String, required: true },
    status: { type: String, required: true },
})

const emit = defineEmits(['point-click'])
const step = 40
const margin = 30
const viewSize = computed(() => props.size * step + margin * 2)
const movePath = computed(() => props.pendingMove?.kind === 'boundary'
    ? props.pendingMove.path
    : [])
const hint = computed(() => {
    if (props.pendingMove?.kind === 'point') {
        return 'Нажмите на точку ещё раз, чтобы подтвердить ход, или выберите соседнюю свою точку для стены.'
    }
    if (props.pendingMove?.kind === 'boundary') {
        return 'Продолжайте стену по соседним своим точкам и замкните её кнопкой или нажатием на начало.'
    }
    return 'Поставьте точку или выберите свою точку, чтобы начать стену.'
})

function pointPosition({ x, y }) {
    return {
        x: margin + x * step,
        y: margin + y * step,
    }
}

function boundaryPoints(boundary) {
    return boundary
        .map(point => {
            const position = pointPosition(point)
            return `${position.x},${position.y}`
        })
        .join(' ')
}

function treasurePoints({ x, y }) {
    const centerX = margin + (x + 0.5) * step
    const centerY = margin + (y + 0.5) * step
    const radius = 8
    return [
        `${centerX},${centerY - radius}`,
        `${centerX + radius},${centerY}`,
        `${centerX},${centerY + radius}`,
        `${centerX - radius},${centerY}`,
    ].join(' ')
}

function pointLabel(color, x, y) {
    if (color === '.') return `Точка ${x}, ${y}, свободна`
    return `Точка ${x}, ${y}, ${color === 'B' ? 'чёрная' : 'красная'}`
}

function isPendingPoint(x, y) {
    return props.pendingMove?.kind === 'point' 
        && props.pendingMove.point.x === x 
        && props.pendingMove.point.y === y;
}   

</script>

<template>
    <div class="game-board">
        <p v-if="status === 'PLAYING'" class="game-board__hint">{{ hint }}</p>
        <svg
            class="game-board__canvas"
            :viewBox="`0 0 ${viewSize} ${viewSize}`"
            role="group"
            :aria-label="`Игровое поле ${size} на ${size}. Ходят ${currentPlayer === 'B' ? 'чёрные' : 'красные'}`"
        >
            <g class="game-board__grid">
                <line
                    v-for="index in size + 1"
                    :key="`vertical-${index}`"
                    :x1="margin + (index - 1) * step"
                    :y1="margin"
                    :x2="margin + (index - 1) * step"
                    :y2="viewSize - margin"
                />
                <line
                    v-for="index in size + 1"
                    :key="`horizontal-${index}`"
                    :x1="margin"
                    :y1="margin + (index - 1) * step"
                    :x2="viewSize - margin"
                    :y2="margin + (index - 1) * step"
                />
            </g>

            <polygon
                v-for="territory in territories"
                :key="territory.id"
                :points="boundaryPoints(territory.boundary)"
                :class="['game-board__territory', `game-board__territory--${territory.owner}`]"
            />
            <g
                v-for="treasure in treasures"
                :key="`${treasure.x}-${treasure.y}`"
                class="game-board__treasure"
                role="img"
                aria-label="Сокровище"
            >
                <title>Сокровище</title>
                <polygon :points="treasurePoints(treasure)" />
            </g>
            <polyline
                v-if="movePath.length > 1"
                :points="boundaryPoints(movePath)"
                class="game-board__draft"
            />

            <g v-for="(row, y) in board" :key="`row-${y}`">
                <circle
                    v-for="(color, x) in row"
                    :key="`${x}-${y}`"
                    :cx="margin + x * step"
                    :cy="margin + y * step"
                    :r="color === '.' ? 11 : 7"
                    :class="[
                        'game-board__point',
                        color === '.' ? 'game-board__point--empty' : `game-board__point--${color}`,
                        isPendingPoint(x, y) ? 'game-board__point--pending' : ''
                    ]"
                    :tabindex="status === 'PLAYING' ? 0 : -1"
                    role="button"
                    :aria-label="pointLabel(color, x, y)"
                    @click="emit('point-click', x, y)"
                    @keydown.enter="emit('point-click', x, y)"
                    @keydown.space.prevent="emit('point-click', x, y)"
                />
            </g>
        </svg>
    </div>
</template>

<style lang="scss" scoped>
.game-board {
    width: min(100%, 760px);
    margin: 0 auto;
}

.game-board__hint {
    margin: 0 0 12px;
    color: #6b7280;
    font-size: 14px;
}

.game-board__canvas {
    display: block;
    width: 100%;
    height: auto;
    touch-action: manipulation;
}

.game-board__grid line {
    stroke: #d3d3d3;
    stroke-width: 1;
}

.game-board__territory {
    stroke-width: 4;
    fill-opacity: 0.12;
}

.game-board__territory--B {
    stroke: #202020;
    fill: #202020;
}

.game-board__territory--R {
    stroke: #d32f2f;
    fill: #d32f2f;
}

.game-board__treasure {
    fill: #f4b400;
    stroke: #9a6700;
    stroke-width: 1.5;
    pointer-events: none;
}

.game-board__draft {
    fill: none;
    stroke: #3574c8;
    stroke-width: 3;
    stroke-dasharray: 6 5;
    pointer-events: none;
}

.game-board__point {
    cursor: pointer;
    outline: none;
}

.game-board__point--empty {
    fill: transparent;
}

.game-board__point--empty:hover,
.game-board__point--empty:focus {
    fill: #3574c8;
    fill-opacity: 0.25;
}

.game-board__point--B {
    fill: #202020;
}

.game-board__point--R {
    fill: #d32f2f;
}

.game-board__point--pending {
    fill-opacity: 0.4;
    stroke: #3574c8;
    stroke-width: 2;
    stroke-dasharray: 4 2;
    animation: pulse-point 1.5s infinite;
}

@keyframes pulse-point {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}
</style>
