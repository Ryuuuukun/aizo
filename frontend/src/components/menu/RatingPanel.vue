<script setup>
import { NDataTable, NCard } from 'naive-ui'
import { ref } from 'vue'

const rating = ref([
    { rank: 1, name: 'Бот Ивана', score: 1000000 },
    { rank: 2, name: 'Иван', score: 1100 },
    { rank: 3, name: 'Новичок1', score: 950 },
    { rank: 4, name: 'Новичок2', score: 400 },
])

const columns = [
    { title: 'Место', key: 'rank', width: 80, align: 'center' },
    { title: 'Игрок', key: 'name' },
    { title: 'Очки', key: 'score', align: 'right' },
]
</script>

<template>
    <n-card title="Рейтинг игроков" class="rating-panel" size="large">
        <n-data-table
            :columns="columns"
            :data="rating"
            :bordered="false"
            :single-line="false"
        />
    </n-card>
</template>

<style lang="scss" scoped>
.rating-panel {
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, .05);
}
</style>