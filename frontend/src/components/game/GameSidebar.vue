<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import PlayerCard from './PlayerCard.vue'
import TurnIndicator from './TurnIndicator.vue'
import ScorePanel from './ScorePanel.vue'
import TurnTimer from './TurnTimer.vue'
import { resolveTurnColor } from '@/utils/session'
import { usePlayerName } from '@/composables/usePlayerName'

const props = defineProps({

    session: { type: Object, default: null },

    mode: { type: String, default: 'local' },

    myColor: { type: String, default: null },
})

const emit = defineEmits(['timeout'])
const store = useGameStore()

const isOnline = computed(() => props.session != null)

const creatorRef = computed(() => props.session?.creator ?? null)
const opponentRef = computed(() => props.session?.opponent ?? null)
const turnPlayerRef = computed(() => props.session?.turnPlayer ?? null)

const { name: creatorName } = usePlayerName(creatorRef)
const { name: opponentName } = usePlayerName(opponentRef)
const { name: turnPlayerName } = usePlayerName(turnPlayerRef)


const onlineTurnColor = computed(() =>
    isOnline.value ? resolveTurnColor(props.session) : null
)

const activePlayer = computed(() => {
    if (isOnline.value) {
        return {
            name: turnPlayerName.value,
            color: onlineTurnColor.value === 'B' ? 'black' : 'red',
        }
    }
    return store.activePlayer
})


const players = computed(() => {
    if (isOnline.value) {
        return [
            {
                name: creatorName.value,
                color: 'black',
                score: props.session.creatorScore ?? 0,
                isMe: props.myColor === 'B',
            },
            {
                name: opponentName.value,
                color: 'red',
                score: props.session.opponentScore ?? 0,
                isMe: props.myColor === 'R',
            },
        ]
    }

    const base = store.players
    if (props.mode === 'computer') {
        return [
            base[0],
            { ...base[1], name: 'Бот' },
        ]
    }
    return base
})


const timeLimitMs = computed(() => {
    if (!isOnline.value) return null
    const raw = props.session.timeLimit
    if (raw == null) return null

    return raw
})

const activeIndex = computed(() => {
    if (isOnline.value) {
        return onlineTurnColor.value === 'B' ? 0 : 1
    }
    return store.turn
})
</script>

<template>
    <aside class="game-sidebar">
        <TurnTimer
            v-if="!isOnline && !store.isFinished"
            :active-player="store.currentPlayer"
            :status="store.game.status"
            :players="players"
            :duration="store.turnDuration"
            :auto-finish="true"
            @timeout="emit('timeout')"
        />

        <TurnTimer
            v-else-if="isOnline && session.status === 'PLAYING'"
            :active-player="onlineTurnColor"
            :status="session.status"
            :players="players"
            :creator-remaining-ms="session.creatorRemainingMs"
            :opponent-remaining-ms="session.opponentRemainingMs"
            :server-time="session.serverTime"
            :time-limit-ms="timeLimitMs"
            :auto-finish="false"
            @timeout="emit('timeout')"
        />

        <TurnIndicator v-if="!store.isFinished" :player="activePlayer" />

        <PlayerCard
            v-for="(p, i) in players"
            :key="i"
            :player="p"
            :active="!store.isFinished && i === activeIndex"
        />

        <ScorePanel :players="players" />
    </aside>
</template>

<style lang="scss" scoped>
.game-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
</style>