<script setup>
import { DrawSystem, EventSystem } from '@/lib/base';
import { Engine } from '@/lib/ecs';
import { NP } from 'naive-ui';
import { onMounted, ref } from 'vue';

const canvas  = ref(null);
const context = ref(null);

/*
GameState {
    points: ...
    territory: ...

    turnPlayer: ...
    playerA: ...
    playerB: ...
}

*/
</script>

<template>
    <canvas ref="canvas" class="canvas" width="500" height="500"/>
</template>

<style lang="scss">
.ava {
    width: 3rem;
    height: 3rem;
    background: red;
}

.canvas {
    outline: 2px solid red;
}
</style>
