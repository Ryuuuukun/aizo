<script setup>
import { NFlex, NEmpty, NSpin } from 'naive-ui'
import GameListItem from './GameListItem.vue'

defineProps({
    games: { type: Array, required: true },
    loading: { type: Boolean, default: false },
})
defineEmits(['join'])
</script>

<template>
    <div class="game-list">
        <n-spin v-if="loading" class="game-list__spin" />

        <n-empty
            v-else-if="games.length === 0"
            description="Пока нет игр, ожидающих игроков"
        />

        <n-flex v-else vertical size="small">
            <GameListItem
                v-for="g in games"
                :key="g.id"
                :game="g"
                @join="$emit('join', $event)"
            />
        </n-flex>
    </div>
</template>

<style lang="scss" scoped>
.game-list__spin {
    display: flex;
    justify-content: center;
    padding: 32px 0;
}
</style>