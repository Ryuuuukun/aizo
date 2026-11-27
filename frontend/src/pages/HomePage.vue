<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import GameBoard from '@/components/GameBoard.vue';
import { createGame } from '@/game/gameState';

const authStore = useAuthStore();
const boardSize = ref(8);
const game = ref(null);

function startGame() {
    game.value = createGame(boardSize.value);
}
</script>

<template>
    <div class="home">
        <AppHeader />
        <main class="home__content">
            <RouterView />
        </main>
    </div>
    <main class="home">
        <header class="home__header">
            <h1>Захват территории</h1>
            <button v-if="authStore.isAuthenticated" type="button" @click="authStore.logout()">
                Выйти
            </button>
        </header>

        <form v-if="!game" class="home__setup" @submit.prevent="startGame">
            <label for="board-size">Размер поля</label>
            <input
                id="board-size"
                v-model.number="boardSize"
                type="number"
                min="4"
                max="20"
                required
            >
            <button type="submit">Начать игру</button>
            <p>Локальная игра для двух игроков за одним компьютером.</p>
        </form>

        <GameBoard v-else :initial-state="game" @restart="game = null" />

        <RouterView />
    </main>
</template>

<style lang="scss" scoped>
.home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;

    &__content {
        flex: 1;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px;
    }
}
</style>
<style scoped>
.home {
    width: min(100% - 2rem, 920px);
    margin: 0 auto;
    padding: 1rem 0 2rem;
    font-family: system-ui, sans-serif;
}

.home__header,
.home__setup {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.home__header {
    justify-content: space-between;
    margin-bottom: 1.5rem;
}

.home__header h1 {
    margin: 0;
    font-size: 1.4rem;
}

.home__setup {
    align-items: flex-start;
    flex-direction: column;
    max-width: 20rem;
}

.home__setup input,
.home__setup button,
.home__header button {
    padding: 0.5rem 0.75rem;
}

.home__setup p {
    margin: 0;
    color: #555;
}
</style>
