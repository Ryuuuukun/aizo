<script setup>
import { RouterLink } from 'vue-router'

const cards = [
    {
        title: 'Локальная игра',
        description: 'Два игрока за одним компьютером. Идеально для быстрого старта. Бог в помощь)',
        to: { name: 'Game' },
        accent: 'blue',
    },
    {
        title: 'Онлайн',
        description: 'Создайте игру или присоединитесь к сопернику по сети.',
        to: { name: 'Lobby' },
        accent: 'purple',
    },
    {
        title: 'Правила',
        description: 'Что это?',
        to: { name: 'Rules' }, 
        accent: 'green',
    },
]
</script>

<template>
    <div class="menu">
        <section class="menu__hero">
            <h1 class="menu__title">Игра «Точки»</h1>
            <p class="menu__subtitle">
                Захватывайте территории, замыкая многоугольники из своих точек.
                Играйте с другом за одним компьютером или онлайн.
            </p>
        </section>

        <section class="menu__cards">
            <template v-for="card in cards" :key="card.title">
                <RouterLink
                    v-if="card.to"
                    :to="card.to"
                    class="menu__card"
                    :class="`menu__card--${card.accent}`"
                >
                    <div class="menu__card-emoji">{{ card.emoji }}</div>
                    <h2 class="menu__card-title">{{ card.title }}</h2>
                    <p class="menu__card-desc">{{ card.description }}</p>
                </RouterLink>

                <div
                    v-else
                    class="menu__card menu__card--disabled"
                    :class="`menu__card--${card.accent}`"
                >
                    <div class="menu__card-emoji">{{ card.emoji }}</div>
                    <h2 class="menu__card-title">{{ card.title }}</h2>
                    <p class="menu__card-desc">{{ card.description }}</p>
                </div>
            </template>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.menu {
    max-width: 1080px;
    margin: 0 auto;
    padding: 24px 0 64px;
}

.menu__hero {
    text-align: center;
    padding: 40px 24px 32px;
}

.menu__title {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 16px;
    background: linear-gradient(135deg, #4a6cf7 0%, #a855f7 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.menu__subtitle {
    font-size: 18px;
    color: #6b7280;
    max-width: 620px;
    margin: 0 auto;
    line-height: 1.6;
}

.menu__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
    margin: 32px 0 48px;
}

.menu__card {
    --accent-color: #4a6cf7;
    display: flex;
    flex-direction: column;
    padding: 32px 28px 28px;
    background: #fff;
    border-radius: 18px;
    border: 2px solid transparent;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 36px rgba(74, 108, 247, .15);
        border-color: var(--accent-color);
    }

    &--blue   { --accent-color: #4a6cf7; }
    &--purple { --accent-color: #a855f7; }
    &--green  { --accent-color: #10b981; }

    &--disabled {
        opacity: .7;
        cursor: default;
        &:hover {
            transform: none;
            box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
            border-color: transparent;
        }
    }
}

.menu__card-emoji {
    font-size: 44px;
    line-height: 1;
    margin-bottom: 18px;
}

.menu__card-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 8px;
}

.menu__card-desc {
    color: #6b7280;
    margin: 0 0 20px;
    flex: 1;
    line-height: 1.5;
}

.menu__card-cta {
    color: var(--accent-color);
    font-weight: 600;
    font-size: 15px;
}

.menu__teaser {
    background: #fff;
    padding: 28px 36px;
    border-radius: 18px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
}

.menu__teaser-title {
    font-size: 20px;
    margin: 0 0 14px;
}

.menu__steps {
    margin: 0;
    padding-left: 22px;
    color: #374151;
    line-height: 1.8;

    li + li { margin-top: 6px; }
}
</style>