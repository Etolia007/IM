<script setup lang="ts">
import { ref, onUnmounted } from "vue";

interface Props {
    ImageInfo: any[],
    total?: number
}
defineProps<Props>()

const checkList = ref<any[]>([])

// 防抖点击
let clickTimer: number | null = null

const toggleCheck = (id: any) => {
  if (clickTimer) {
    clearTimeout(clickTimer)
  }
  
  clickTimer = setTimeout(() => {
    const index = checkList.value.indexOf(id)
    if (index > -1) {
      checkList.value.splice(index, 1)
    } else {
      checkList.value.push(id)
    }
    clickTimer = null
  }, 50)
}

defineExpose({
    checkList
})

onUnmounted(() => {
  if (clickTimer) {
    clearTimeout(clickTimer)
  }
})
</script>

<template>
    <div>
        <div v-if="ImageInfo.length != 0">
            <el-checkbox-group v-model="checkList">
                <el-row :gutter="[20, 20]">
                    <el-col :xs="12" :sm="8" :md="6" v-for="item in ImageInfo" :key="item.id">
                        <div class="image-item">
                            <el-checkbox :label="item.id" class="custom-checkbox">
                            </el-checkbox>
                            <el-image 
                                @click="toggleCheck(item.id)" 
                                :src="item.data" 
                                fit="contain"
                                :class="{ 'selected-image': checkList.includes(item.id) }"
                                class="image-content"
                                hide-on-click-modal
                                preview-teleported
                                lazy
                            />
                        </div>
                    </el-col>
                </el-row>
            </el-checkbox-group>
            
            <div v-if="total && ImageInfo.length < total" style="text-align: center; padding: 10px; color: #909399;">
                已显示 {{ ImageInfo.length }} / {{ total }} 张图片
            </div>
        </div>
        <div v-else style="text-align: center;">
            <h3>当前选项下暂无图片</h3>
        </div>
    </div>
</template>

<style scoped>
.image-item {
    position: relative; 
    margin-bottom: 16px;
    margin-right: 16px;
}

.image-content {
    width: 100%; 
    height: 100%; 
    border: 1px solid #e1e8ed; 
    border-radius: 8px;
    background: #f5f5f5;
    cursor: pointer;
    transition: all 0.3s ease;
}

.custom-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
}

.custom-checkbox :deep(.el-checkbox__label) {
    display: none;
}

.custom-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #409EFF;
    border-color: #409EFF;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .image-item {
        margin-bottom: 12px;
    }
    
    .custom-checkbox {
        top: 6px;
        left: 6px;
    }
    
    .custom-checkbox :deep(.el-checkbox__inner) {
        width: 18px;
        height: 18px;
    }
}

.el-col:hover .image-content {
    border-color: #409EFF;
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
    transition: all 0.3s ease;
    transform: translateY(-3px);
}

.selected-image {
    box-shadow: 0 0 0 3px #409EFF  !important;
}

:deep(.el-checkbox__inner) {
  border-radius: 50%;
  top:-9px;
}
</style>