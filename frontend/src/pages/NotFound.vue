<script setup>
import { RouterLink } from 'vue-router'
import { NResult, NButton } from 'naive-ui'
</script>

<template>
    <div class="notfound">
        <n-result status="404" title="Страница не найдена">
            <template #footer>
                <RouterLink :to="{ name: 'Menu' }">
                    <n-button type="primary">В меню</n-button>
                </RouterLink>
            </template>
        </n-result>
    </div>
</template>

<style lang="scss" scoped>
.notfound {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>