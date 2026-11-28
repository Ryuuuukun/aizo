<script setup>
defineProps({
    players: { type: Array, required: true },
})
</script>

<template>
    <div class="score-panel">
        <div class="score-panel__title">Счёт</div>
        <div
            v-for="p in players"
            :key="p.color"
            class="score-panel__row"
        >
            <span class="score-panel__dot" :class="`score-panel__dot--${p.color}`" />
            <span class="score-panel__name">{{ p.name }}</span>
            <strong class="score-panel__value">{{ p.score }}</strong>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.score-panel {
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .05);

    &__title { font-weight: 600; margin-bottom: 14px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }

    &__row { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    &__row + &__row { border-top: 1px solid #f1f2f5; }

    &__dot { width: 12px; height: 12px; border-radius: 50%; }
    &__dot--black { background: #1e1e2e; }
    &__dot--red   { background: #e11d48; }

    &__name  { flex: 1; }
    &__value { font-size: 20px; font-weight: 700; }
}
</style>