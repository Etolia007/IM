<script setup lang="ts">
import { reactive, ref } from 'vue';
import draggable from 'vuedraggable';
const tableData = reactive([
    { id: 1, name: '张三', age: 30, job: '工程师' },
    { id: 2, name: '李四', age: 25, job: '设计师' },
    { id: 3, name: '王五', age: 35, job: '产品经理' },
])

const drag = ref(true)

</script>

<template>
    <div>
        <draggable :list="tableData" ghost-class="ghost" chosen-class="chosenClass" animation="300"
            @start="drag = true" @end="drag = false" item-key="id">
            <template #item="{ element }" :key="element.id">
                <li class="border_16">
                    <img src="">
                    <div>{{ element.name }}</div>
                </li>
            </template>
        </draggable>
    </div>
</template>

<style scoped></style>
