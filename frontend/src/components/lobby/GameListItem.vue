<script setup>
import { computed } from 'vue'
import { NCard, NButton, NTag } from 'naive-ui'
import { displayName } from '@/utils/user'

const props = defineProps({
    game: { type: Object, required: true },
})
defineEmits(['join'])

const creatorName = computed(() => displayName(props.game.creator))
const createdAt = computed(() =>
    new Date(props.game.createdAt).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    }),
)
const isWaiting = computed(() => props.game.status === 'WAITING')
</script>

<template>
    <n-card size="small" class="game-item" hoverable>
        <div class="game-item__row">
            <div class="game-item__info">
                <div class="game-item__name">{{ game.name || 'Без названия' }}</div>
                <div class="game-item__meta">
                    <span>Хост: {{ creatorName }}</span>
                    <span>·</span>
                    <span>{{ createdAt }}</span>
                </div>
            </div>

            <div class="game-item__actions">
                <n-tag :type="isWaiting ? 'success' : 'default'" size="small">
                    {{ isWaiting ? 'Ожидание' : game.status }}
                </n-tag>
                <n-button
                    type="primary"
                    size="small"
                    :disabled="!isWaiting"
                    @click="$emit('join', game.id)"
                >
                    Присоединиться
                </n-button>
            </div>
        </div>
    </n-card>
</template>

<style lang="scss" scoped>
.game-item {
    transition: transform .15s, box-shadow .15s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, .06);
    }
}
</style>