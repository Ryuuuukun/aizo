<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
    activePlayer: { type: String, required: true },
    status: { type: String, required: true },
    players: { type: Array, required: true },
    duration: { type: Number, default: null },
    creatorRemainingMs: { type: Number, default: null },
    opponentRemainingMs: { type: Number, default: null },
    serverTime: { type: String, default: null },
    timeLimitMs: { type: Number, default: null },
    autoFinish: { type: Boolean, default: true }
})

const emit = defineEmits(['timeout'])

const timeLeft = ref({ B: 0, R: 0 })
let timer = null
let lastTickAt = 0
let serverOffset = 0

function formatTime(ms) {
    if (ms <= 0) return '0:00'
    const totalSeconds = Math.ceil(ms / 1000)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function progressFor(color) {
    if (!props.timeLimitMs) return null
    const left = timeLeft.value[color]
    return Math.max(0, Math.min(100, (left / props.timeLimitMs) * 100))
}

function syncFromProps() {
    if (props.creatorRemainingMs != null && props.opponentRemainingMs != null) {
        timeLeft.value.B = props.creatorRemainingMs
        timeLeft.value.R = props.opponentRemainingMs
        serverOffset = props.serverTime
            ? new Date(props.serverTime).getTime() - Date.now()
            : 0
        lastTickAt = Date.now() + serverOffset
    } else if (props.duration != null) {
        timeLeft.value.B = props.duration * 1000
        timeLeft.value.R = props.duration * 1000
        serverOffset = 0
        lastTickAt = Date.now()
    }
}

function startTimer() {
    stopTimer()
    if (props.status !== 'PLAYING') return
    syncFromProps()

    timer = setInterval(() => {
        if (props.status !== 'PLAYING') return

        const now = Date.now() + serverOffset
        const elapsed = now - lastTickAt
        lastTickAt = now

        const current = props.activePlayer
        if (timeLeft.value[current] > 0) {
            timeLeft.value[current] = Math.max(0, timeLeft.value[current] - elapsed)
            if (timeLeft.value[current] === 0 && props.autoFinish) {
                stopTimer()
                emit('timeout')
            }
        }
    }, 250)
}

function stopTimer() {
    if (timer) {
        clearInterval(timer)
        timer = null
    }
}

watch(
    () => [props.creatorRemainingMs, props.opponentRemainingMs, props.serverTime],
    () => {
        if (props.status === 'PLAYING') syncFromProps()
    }
)

watch(() => props.status, (newStatus) => {
    if (newStatus === 'PLAYING') startTimer()
    else stopTimer()
}, { immediate: true })

onUnmounted(() => stopTimer())
</script>

<template>
    <div class="chess-clocks">
        <div
            v-for="p in players"
            :key="p.color"
            class="chess-clock"
            :class="{
                'chess-clock--active': activePlayer === (p.color === 'black' ? 'B' : 'R') && status === 'PLAYING',
                'chess-clock--danger': timeLeft[p.color === 'black' ? 'B' : 'R'] <= 10000
            }"
        >
            <span class="chess-clock__name">{{ p.name }}</span>
            <span class="chess-clock__time">
                {{ formatTime(timeLeft[p.color === 'black' ? 'B' : 'R']) }}
            </span>
            <div
                v-if="progressFor(p.color === 'black' ? 'B' : 'R') !== null"
                class="chess-clock__bar"
            >
                <div
                    class="chess-clock__bar-fill"
                    :style="{ width: progressFor(p.color === 'black' ? 'B' : 'R') + '%' }"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chess-clocks {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
}

.chess-clock {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 14px;
    background: #fff;
    border-radius: 14px;
    border: 2px solid transparent;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
    transition: border-color 0.2s, background 0.2s;

    &--active {
        border-color: #4a6cf7;
        background: #f8faff;
    }

    &--danger {
        .chess-clock__time { color: #e11d48; }
    }

    &__name {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 2px;
    }

    &__time {
        font-size: 20px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: #1e1e2e;
        transition: color 0.3s;
    }

    &__bar {
        width: 100%;
        height: 4px;
        margin-top: 6px;
        background: #eef1f6;
        border-radius: 2px;
        overflow: hidden;
    }

    &__bar-fill {
        height: 100%;
        background: #4a6cf7;
        transition: width 0.25s linear;
    }

    &--danger &__bar-fill {
        background: #e11d48;
    }
}
</style>