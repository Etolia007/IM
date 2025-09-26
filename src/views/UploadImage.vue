<template>
     <!-- 添加新图片的表单 -->
        <fieldset>
            <legend>添加新图片</legend>
            <label>
                类型:
                <el-select v-model="imageType" clearable placeholder="请选择图片类型">
                    <el-option v-for="item in filteredImageTypes" :key="item" :label="item" :value="item" />
                </el-select>
            </label>
            <br />
            <label>
                图片文件:
                <input type="file" @change="handleFileSelect" accept="image/*" />
            </label>
            <br />
            <button @click="addImage">添加图片</button>
            <p>{{ status }}</p>
        </fieldset>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { ImageType } from '../data/ImageType'; // 导入图片类型数据
import { db, loadImages } from '../db';
import { loadImagesFromDatabase } from '../data/ImageInfo';

const status = ref('');
const imageType = ref('');
const selectedFile = ref<File | null>(null);

// 过滤掉"全部"选项，因为添加图片时不需要这个选项
const filteredImageTypes = computed(() => {
    return ImageType.filter(type => type !== '全部');
});

const handleFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        selectedFile.value = input.files[0];
    }
};

// 从文件名提取名称（不含扩展名）
const getFileNameWithoutExtension = (filename: string) => {
    return filename.split('.').slice(0, -1).join('.') || filename;
};

const addImage = async () => {
    if (!selectedFile.value) {
        status.value = '请选择图片文件';
        return;
    }

    if (!imageType.value) {
        status.value = '请选择图片类型';
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            const fileName = getFileNameWithoutExtension(selectedFile.value?.name || '未命名图片');

            await db.images.add({
                name: fileName,
                type: imageType.value,
                data: base64Data,
                filename: selectedFile.value?.name || '',
                uploadedAt: new Date()
            });

            status.value = `图片 ${fileName} 添加成功`;

            // 重置表单
            imageType.value = '';
            selectedFile.value = null;

            // 重新加载图片列表
            await loadImages();
            // 在添加图片成功后
            await loadImagesFromDatabase();
        };
        reader.readAsDataURL(selectedFile.value);
    } catch (error) {
        status.value = `添加图片失败: ${error}`;
    }

};
</script>
<style scoped>

button {
    background: #f56c6c;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #e55c5c;
}

/* 调整选择框样式 */
:deep(.el-select) {
    width: 200px;
}

</style>