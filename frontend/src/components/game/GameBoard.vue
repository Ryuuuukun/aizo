<script setup>
import { ref } from 'vue'

defineProps({
    size: { type: Number, required: true },
})

const emit = defineEmits(['cell-click', 'point-click', 'cancel-wall', 'confirm-wall'])

const canvas = ref(null)

</script>

<template>
    <div class="game-board">
        <canvas
            ref="canvas"
            :width="size * 40"
            :height="size * 40"
            class="game-board__canvas"
        />
    </div>
</template>

<style lang="scss" scoped>
.game-board__canvas {
    width: 100%;
    height: 100%;
    max-width: min(75vh, 720px);
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, .06);
    cursor: crosshair;
}
</style>