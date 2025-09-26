<template>
  <div>
    <!-- 添加新图片的表单 -->
    <fieldset>
      <legend>添加新图片</legend>
      <label>
        名称:
        <input v-model="imageName" type="text" />
      </label>
      <br />
      <label>
        类型:
        <el-select v-model="imageType" clearable placeholder="请选择图片类型">
          <el-option
            v-for="item in filteredImageTypes"
            :key="item"
            :label="item"
            :value="item"
          />
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

    <!-- 图片列表展示 -->
    <h2>图片列表 ({{ images.length }}张)</h2>
    <div class="image-grid">
      <div v-for="image in images" :key="image.id" class="image-item">
        <img :src="image.data" :alt="image.name" class="image-preview" />
        <div class="image-info">
          <span class="name">{{ image.name }}</span>
          <span class="type">{{ image.type }}</span>
          <span class="filename">{{ image.filename }}</span>
          <span class="date">{{ formatDate(image.uploadedAt) }}</span>
        </div>
        <button @click="deleteImage(image.id!)">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { db } from '../db';
import type { Image } from '../db';
import { ImageType } from '../data/ImageType'; // 导入图片类型数据

const status = ref('');
const imageName = ref('');
const imageType = ref('');
const selectedFile = ref<File | null>(null);
const images = ref<Image[]>([]);

// 过滤掉"全部"选项，因为添加图片时不需要这个选项
const filteredImageTypes = computed(() => {
  return ImageType.filter(type => type !== '全部');
});

// 加载图片列表
const loadImages = async () => {
  try {
    images.value = await db.images.toArray();
  } catch (error) {
    console.error('加载图片失败:', error);
  }
};

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    // 如果没有填写名称，使用文件名作为默认名称
    if (!imageName.value) {
      const fileName = input.files[0].name.split('.')[0] || '未命名图片';
      imageName.value = fileName;
    }
  }
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
      
      await db.images.add({
        name: imageName.value,
        type: imageType.value,
        data: base64Data,
        filename: selectedFile.value?.name || '',
        uploadedAt: new Date()
      });

      status.value = `图片 ${imageName.value} 添加成功`;
      
      // 重置表单
      imageName.value = '';
      imageType.value = '';
      selectedFile.value = null;
      
      // 重新加载图片列表
      await loadImages();
    };
    reader.readAsDataURL(selectedFile.value);
  } catch (error) {
    status.value = `添加图片失败: ${error}`;
  }
};

// 删除图片
const deleteImage = async (id: number) => {
  try {
    await db.images.delete(id);
    await loadImages(); // 重新加载列表
    status.value = '图片删除成功';
  } catch (error) {
    status.value = `删除图片失败: ${error}`;
  }
};

// 组件加载时获取图片列表
onMounted(() => {
  loadImages();
});
</script>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.image-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.image-preview {
  width: 100%;
  height: 150px;
  object-fit: contain;
  border-radius: 4px;
  background: #f5f5f5;
}

.image-info {
  margin: 10px 0;
}

.image-info span {
  display: block;
  margin: 2px 0;
}

.name {
  font-weight: bold;
}

.type, .filename, .date {
  color: #666;
  font-size: 12px;
}

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