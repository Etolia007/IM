<script setup lang="ts">
import { ref } from "vue";
import { ImageInfo } from "../data/ImageInfo";

// 子组件获取父组件传值
interface Props {
    ImageInfo: any[],
}
// const props = 
defineProps<Props>()

const checkList = ref<any[]>([]) // 存储选中的图片对象

defineExpose({
    checkList
})

// 切换选中状态的方法
const toggleCheck = (id: any) => {
    const index = checkList.value.indexOf(id)
    if (index > -1) {
        // 如果已存在，则移除
        checkList.value.splice(index, 1)
    } else {
        // 如果不存在，则添加
        checkList.value.push(id)
    }
}
</script>

<template>
    <div>
        <div v-if="ImageInfo.length != 0">
            <el-checkbox-group v-model="checkList">
                <el-row :gutter="12">
                    <el-col :span="6" v-for="(item, index) in ImageInfo" :key="index">
                        <div style="position: relative;">
                            <!-- 将 label 设置为空字符串 -->
                            <el-checkbox :label="item.id" :value="item.id" class="custom-checkbox">
                                <!-- 空内容 -->
                                 <!-- <span>{{ item.name }}</span> -->
                            </el-checkbox>
                            <el-image @click="toggleCheck(item.id)" v-if="checkList != null" :src="item.url" fit="contain"
                                style="width: 100%; height: 100%;" />
                        </div>
                    </el-col>
                </el-row>
            </el-checkbox-group>
        </div>
        <div v-else style="text-align: center;">
            <h3>当前选项下暂无图片</h3>
        </div>
    </div>
</template>

<style scoped>
.custom-checkbox {
    /* position: absolute; */
    top: 5px;
    /* right: 25px; */
    right: 44%;
    z-index: 10;
}

.custom-checkbox .el-checkbox__label {
    display: none;
}
</style>
