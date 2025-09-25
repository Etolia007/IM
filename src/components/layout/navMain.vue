<template>
    <div>
        <transition name="el-fade-in-linear">
            <router-view />
        </transition>
    </div>
</template>
<script setup lang="ts">


</script>
<style scoped>
.fade-transform-enter-active,
.fade-transform-leave-active {
    transition: all 0.5s
}

.fade-transform-enter-from {
    opacity: 0;
    transition: translateX(-30px);
}

.fade-transform-leave-to {
    opacity: 0;
    transition: translateX(30px);

}
</style>