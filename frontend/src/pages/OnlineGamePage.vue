<script setup>
import { useSession } from '@/stores/session';
import { NCard } from 'naive-ui'

const session = useSession();

onMounted(async () => {
    await session.load();
});
</script>

<template>
    <n-card title="Онлайн-игра">
        <p>Комната игры.</p>
    </n-card>
</template>