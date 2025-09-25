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
        <!-- <draggable v-model="columns" tag="tr">
            <el-table :data="tableData" border>
                <el-table-column v-for="(col, index) in columns" :key="index" :prop="col.prop"
                    :label="col.label"></el-table-column>
            </el-table>
        </draggable> -->
        <!-- <draggable :list="columns" item-key="id">
            <template #item="{ element }">
                <el-table :data="tableData" border>
                    <el-table-column v-for="(col, index) in columns" :key="index" :prop="col.prop"
                        :label="col.label"></el-table-column>
                </el-table>
                {{ element.name }} - {{ element.age }} - {{ element.job }}
            </template>
</draggable> -->

        <draggable :list="tableData" ghost-class="ghost" chosen-class="chosenClass" animation="300"
            @start="drag = true" @end="drag = false" item-key="id">
            <template #item="{ element }" :key="element.id">
                <li class="border_16">
                    <img src="">
                    <div>{{ element.name }}</div>
                </li>
            </template>
        </draggable>

        <!-- <draggable v-model="tableData" item-key="id">
            <template #item="{ element }">
                <div>{{ element.name }}</div>
            </template>
        </draggable> -->

        <!-- <draggable v-model="tableData" @start="drag = true" @end="drag = false" item-key="index">
            <template #item="{ element, index }">
                <div class="connects">
                    <el-input v-model="element.name" @input="inputContacts(index)" placeholder="名字"></el-input>
                </div>
            </template>
        </draggable> -->

    </div>

    <!-- <div v-for="Image in ImageInfo" class="block">
        <el-image style="width: 100px; height: 100px" :src="Image.url" fit="fill">
            <template #placeholder>
                <div class="image-slot">Loading<span class="dot">...</span></div>
            </template>
</el-image>
</div> -->
</template>

<style scoped></style>
