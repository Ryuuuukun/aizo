<script setup>
import { useAuthStore } from '@/stores/auth';
import { NButton, NFlex, NLayout, NLayoutContent, NLayoutHeader } from 'naive-ui';
import { RouterLink, RouterView } from 'vue-router';

const authStore = useAuthStore();
</script>

<template>
    <n-layout>
        <n-layout-header>
            <n-flex>
                <router-link :to="{ name: 'Me' }">
                    To me
                </router-link>
                <router-link :to="{ name: 'Game' }">
                    To game
                </router-link>
            </n-flex>
        </n-layout-header>
        <n-layout-content>
            <router-view/>
        </n-layout-content>
    </n-layout>
</template>
