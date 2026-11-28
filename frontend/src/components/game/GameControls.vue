<script setup>
import { NButton, NFlex } from 'naive-ui'

defineProps({
    canUndo:      { type: Boolean, default: false },
    canEnd:       { type: Boolean, default: false },
    wallBuilding: { type: Boolean, default: false },
    endLabel:     { type: String, default: 'Завершить игру' },
})

defineEmits(['undo', 'cancel-wall', 'confirm-wall', 'offer-end'])
</script>

<template>
    <n-flex vertical size="small" class="game-controls">
        <template v-if="wallBuilding">
            <n-button type="primary" block @click="$emit('confirm-wall')">
                Замкнуть стену
            </n-button>
            <n-button block @click="$emit('cancel-wall')">
                Отменить стену
            </n-button>
        </template>

        <template v-else>
            <n-button block :disabled="!canUndo" @click="$emit('undo')">
                Отменить ход
            </n-button>
            <n-button type="error" block :disabled="!canEnd" @click="$emit('offer-end')">
                {{ endLabel }}
            </n-button>
        </template>
    </n-flex>
</template>