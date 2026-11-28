<script setup>
import { RouterLink } from 'vue-router'
import { NCard, NButton, NFlex } from 'naive-ui'

const sections = [
    {
        title: 'Цель игры',
        body: 'Захватить как можно большую площадь поля. Побеждает тот, чьи территории в сумме больше.',
    },
    {
        title: 'Поле',
        body: 'Сетка из пересечений. Размер поля вы выбираете перед началом игры — от 4 до 20. Чем больше поле, тем длиннее партия.',
    },
    {
        title: 'Ход игрока',
        body: 'В свой ход вы либо ставите новую точку своего цвета на свободное пересечение, либо начинаете строить стену от своей существующей точки.',
    },
    {
        title: 'Стены и территории',
        body: 'Стена — это ломаная из ваших точек. Если замкнуть её в многоугольник, внутренняя область становится вашей территорией, а точки на границе закрепляются за вами. После первой замкнутой стены игрок получает один дополнительный ход: можно поставить не более одной точки и при желании замкнуть одну стену. После этого ход переходит сопернику.'
    },
    {
        title: 'Завершение партии',
        body: 'Игра заканчивается, когда на поле не остаётся допустимых ходов, либо когда оба игрока согласились завершить её досрочно. Победитель определяется по площади захваченных территорий; при равенстве — ничья.',
    },
    {
        title: 'Локальная игра и онлайн',
        body: 'В локальном режиме оба игрока ходят за одним компьютером по очереди. В онлайне вы создаёте игру или присоединяетесь к ожидающей; первый ход достаётся случайному игроку.',
    },
]
</script>

<template>
    <div class="rules">
        <header class="rules__hero">
            <h1 class="rules__title">Правила игры «Точки»</h1>
            <p class="rules__subtitle">
                Коротко о том, как ставить точки, замыкать территории и побеждать.
            </p>
        </header>

        <section class="rules__grid">
            <n-card
                v-for="s in sections"
                :key="s.title"
                class="rules__card"
                size="large"
                hoverable
            >
                <div class="rules__card-emoji">{{ s.emoji }}</div>
                <h2 class="rules__card-title">{{ s.title }}</h2>
                <p class="rules__card-body">{{ s.body }}</p>
            </n-card>
        </section>

        <section class="rules__cta">
            <n-flex justify="center" size="medium">
                <RouterLink :to="{ name: 'Game' }">
                    <n-button type="primary" size="large">Играть локально</n-button>
                </RouterLink>
                <RouterLink :to="{ name: 'Lobby' }">
                    <n-button size="large">Играть онлайн</n-button>
                </RouterLink>
            </n-flex>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.rules {
    max-width: 1080px;
    margin: 0 auto;
    padding: 24px 0 64px;
}

.rules__hero {
    text-align: center;
    padding: 32px 24px 24px;
}

.rules__title {
    font-size: clamp(32px, 4.5vw, 48px);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
    background: linear-gradient(135deg, #4a6cf7 0%, #a855f7 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.rules__subtitle {
    font-size: 18px;
    color: #6b7280;
    max-width: 620px;
    margin: 0 auto;
    line-height: 1.6;
}

.rules__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin: 16px 0 40px;
}

.rules__card {
    transition: transform .2s ease, box-shadow .2s ease;

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(74, 108, 247, .12);
    }
}

.rules__card-emoji {
    font-size: 36px;
    line-height: 1;
    margin-bottom: 14px;
}

.rules__card-title {
    font-size: 19px;
    font-weight: 700;
    margin: 0 0 10px;
}

.rules__card-body {
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
}

.rules__cta {
    text-align: center;
}
</style>