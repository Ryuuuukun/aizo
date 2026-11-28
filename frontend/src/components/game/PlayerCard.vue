<script setup>
defineProps({
    player: { type: Object, required: true },
    active: { type: Boolean, default: false },
})
</script>

<template>
    <div class="player-card" :class="{ 'player-card--active': active }">
        <span class="player-card__dot" :class="`player-card__dot--${player.color}`" />
        <div class="player-card__info">
            <div class="player-card__name">{{ player.name }}</div>
            <div class="player-card__score">Территория: {{ player.score }}</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.player-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: #fff;
    border: 2px solid transparent;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
    transition: border-color .2s, box-shadow .2s, transform .2s;

    &--active {
        border-color: #4a6cf7;
        box-shadow: 0 4px 16px rgba(74, 108, 247, .18);
    }

    &__dot { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; }
    &__dot--black { background: #1e1e2e; }
    &__dot--red   { background: #e11d48; }

    &__name  { font-weight: 600; font-size: 15px; }
    &__score { font-size: 13px; color: #6b7280; }
}
</style>