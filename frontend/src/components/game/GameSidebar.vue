<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import PlayerCard from './PlayerCard.vue'
import TurnIndicator from './TurnIndicator.vue'
import ScorePanel from './ScorePanel.vue'

const store = useGameStore()

const activePlayer = computed(() => store.activePlayer)
const players = computed(() => store.players)
</script>

<template>
    <aside class="game-sidebar">
        <TurnIndicator v-if="!store.isFinished" :player="activePlayer" />
        <PlayerCard
            v-for="(p, i) in players"
            :key="i"
            :player="p"
            :active="!store.isFinished && i === store.turn"
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