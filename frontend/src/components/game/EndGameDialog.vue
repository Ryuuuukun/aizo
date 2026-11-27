<script setup>
import { computed } from 'vue'
import { NModal, NCard, NResult, NButton, NFlex } from 'naive-ui'

const props = defineProps({
    show:    { type: Boolean, required: true },
    winner:  { type: [Number, String, null], default: null },
    players: { type: Array, required: true },
})

defineEmits(['close', 'again'])

const title = computed(() => {
    if (props.winner === 'draw') return 'Ничья'
    if (props.winner === 0 || props.winner === 1) {
        return `Победил ${props.players[props.winner].name}`
    }
    return 'Игра завершена'
})

const subtitle = computed(() =>
    props.players.map(p => `${p.name}: ${p.score}`).join(' • '),
)
</script>

<template>
    <n-modal :show="show" @update:show="$emit('close')">
        <n-card style="width: 480px;">
            <n-result
                :status="winner === 'draw' ? 'info' : 'success'"
                :title="title"
                :description="subtitle"
            >
                <template #footer>
                    <n-flex justify="center">
                        <n-button type="primary" @click="$emit('again')">Играть снова</n-button>
                        <n-button @click="$emit('close')">В меню</n-button>
                    </n-flex>
                </template>
            </n-result>
        </n-card>
    </n-modal>
</template>