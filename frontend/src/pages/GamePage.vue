<script setup>
import { NButton, NInput } from 'naive-ui';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { online } from '@/api/services/game.js';

const session = computed(() => online.session);

onMounted(() => {
    try {
        online.active();
    } catch (error) {
        // активной сесси может не быть
    }
});

onUnmounted(() => {
    online.clear();
});
</script>

<template>

    <n-button @click="online.create(10)">
        Создать сессию
    </n-button>
    <n-input/>
    <n-button @click="onlineGame.join(sessionId)">
        Присоединиться к сессии
    </n-button>
    <n-button @click="online.offer()">
        Закончить сессию
    </n-button>
    Текущая сессия: {{ session }}
</template>
