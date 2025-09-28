<script setup lang="ts">
import { ref } from "vue";

// 子组件获取父组件传值
interface Props {
    ImageInfo: any[],
}
defineProps<Props>()

const checkList = ref<any[]>([]) // 存储选中的图片ID

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
                    <el-col :span="6" v-for="item in ImageInfo" :key="item.id">
                        <div style="position: relative; margin-bottom: 20px;">
                            <el-checkbox :label="item.id" class="custom-checkbox">
                            </el-checkbox>
                            <el-image 
                                @click="toggleCheck(item.id)" 
                                :src="item.data" 
                                fit="contain"
                                :class="{ 'selected-image': checkList.includes(item.id) }"
                                style="width: 100%; height: 100%; border: 1px solid #e1e8ed; border-radius: 8px;"
                                hide-on-click-modal
                                preview-teleported
                            />
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
    position: absolute;
    top: -3px;
    left: 5px;
    z-index: 10;
}

.custom-checkbox :deep(.el-checkbox__label) {
    display: none;
}

/* 选中状态的样式 */
.custom-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #409EFF;
    border-color: #409EFF;
}

/* 图片容器悬停效果 - 增强 */
.el-col:hover .el-image {
    border-color: #409EFF;
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
    transition: all 0.3s ease;
    transform: translateY(-3px);
}

.selected-image {
    box-shadow: 0 0 0 3px #409EFF !important;
}
/* 确保图片显示正常 */
.el-image {
    background: #f5f5f5;
    cursor: pointer;
    transition: all 0.3s ease;
}
:deep(.el-checkbox__inner) {
  border-radius: 50%;
}
</style>