<script setup>
defineProps({
    player: { type: Object, required: true },
})
</script>

<template>
    <div class="turn-indicator">
        <span>Ход:</span>
        <strong>{{ player.name }}</strong>
        <span class="turn-indicator__dot" :class="`turn-indicator__dot--${player.color}`" />
    </div>
</template>

<style lang="scss" scoped>
.turn-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: #eef2ff;
    border-radius: 14px;
    font-size: 15px;
    color: #1e1e2e;

    strong { color: #4a6cf7; }

    &__dot { width: 14px; height: 14px; border-radius: 50%; }
    &__dot--black { background: #1e1e2e; }
    &__dot--red   { background: #e11d48; }
}
</style>