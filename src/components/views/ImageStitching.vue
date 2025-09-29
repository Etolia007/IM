<script setup lang="ts">
import { onMounted, ref, nextTick, computed, watch, onUnmounted } from 'vue'
import { ImageType } from "../../data/ImageType"
import { StitchingType } from "../../data/StitchingType.ts";
import ImageView from "./ImageView.vue";
import CheckList from './ImageView.vue'
import { Star, CloseBold, Loading } from "@element-plus/icons-vue";
import draggable from 'vuedraggable';
import { loadImages, images } from '../../db';
import { loadImagesFromDatabase } from '../../data/ImageInfo';

interface ListItem {
    value: string
    label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string>('')

// 使用IndexedDB的images数据
const currentCategoryImages = ref<any[]>([])

// 分页相关变量
const pageSize = ref(20)
const currentPage = ref(1)
const loading = ref(false)

// 分页后的图片数据
const paginatedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return currentCategoryImages.value.slice(0, end)
})

// 滚动加载
const onScroll = (event: Event) => {
  const container = event.target as HTMLElement
  if (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) {
    loadMore()
  }
}

const loadMore = () => {
  if (loading.value || paginatedImages.value.length >= currentCategoryImages.value.length) {
    return
  }
  
  loading.value = true
  setTimeout(() => {
    currentPage.value += 1
    loading.value = false
  }, 200)
}

// 分类切换时重置分页
watch(currentCategoryImages, () => {
  currentPage.value = 1
})

onMounted(async () => {
    await loadImages();
    await loadImagesFromDatabase();

    list.value = ImageType.map((item, index) => {
        return { value: index.toString(), label: item }
    })
    options.value = list.value

    if (options.value.length > 0 && options.value[0]) {
        value.value = options.value[0].value
        clickTab(value.value)
    }
})

// 获取过滤后的图片数据
const getFilteredImages = (typeIndex: string) => {
    const index = parseInt(typeIndex);
    if (index === 0) return images.value;

    const typeName = ImageType[index];
    return images.value.filter(image => image.type === typeName);
}

const clickTab = (key: string) => {
    const filtered = getFilteredImages(key);
    currentCategoryImages.value = filtered;
}

const List = ref<InstanceType<typeof CheckList> | null>(null)

// 全选 - 当前分类
const selectAll = () => {
    if (List.value && currentCategoryImages.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = currentCategoryImages.value.map((item) => item.id);

        currentCategoryIds.forEach(id => {
            currentSelected.add(id);
        });

        List.value.checkList = Array.from(currentSelected);
    }
};

// 反选 - 当前分类
const invertSelection = () => {
    if (List.value && currentCategoryImages.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = new Set(currentCategoryImages.value.map((item) => item.id));

        currentCategoryIds.forEach(id => {
            if (currentSelected.has(id)) {
                currentSelected.delete(id);
            } else {
                currentSelected.add(id);
            }
        });

        List.value.checkList = Array.from(currentSelected);
    }
};

// 清空 - 只清空当前分类的选中
const clearSelection = () => {
    if (List.value && currentCategoryImages.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = new Set(currentCategoryImages.value.map(item => item.id));

        currentCategoryIds.forEach(id => {
            currentSelected.delete(id);
        });

        List.value.checkList = Array.from(currentSelected);
    }
};

const drag = ref(true)

const onListChange = (event: any) => {
    console.log('List changed:', event)
}

const getImageName = (id: number) => {
    const image = images.value.find(item => item.id === id)
    return image?.name || '未知'
}

const clickDelete = (element: number) => {
    if (!List.value || !List.value.checkList) return;

    if (element < 0 || element >= List.value.checkList.length) return;

    const deletedItemId = List.value.checkList[element];

    List.value.checkList.splice(element, 1);

    const checkIndex = List.value.checkList.indexOf(deletedItemId);
    if (checkIndex !== -1) {
        List.value.checkList.splice(checkIndex, 1);
    }
}

const stitchingValue = ref(StitchingType[0]?.name)
const stitchingList = ref<typeof StitchingType[0][]>([])

onMounted(() => {
    stitchingList.value = [...StitchingType]
})

const dialogVisible = ref(false)
const stitchedImageUrl = ref('')

// 图片缓存
const imageCache = new Map()

// 优化图片URL获取
const getImageUrl = (id: number) => {
  if (imageCache.has(id)) {
    return imageCache.get(id)
  }
  
  const image = images.value.find(item => item.id === id)
  if (image?.data) {
    imageCache.set(id, image.data)
    return image.data
  }
  return ''
}

// 清空缓存
const clearImageCache = () => {
  imageCache.clear()
}

watch(currentCategoryImages, clearImageCache)

// 拼接控制
let stitchingController: AbortController | null = null

const onStitching = async () => {
  if (stitchingController) {
    stitchingController.abort()
  }
  
  stitchingController = new AbortController()
  dialogVisible.value = true
  await nextTick()
  
  try {
    await draw(stitchingController.signal)
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('图片拼接失败:', error)
    }
  }
}

const draw = async (signal?: AbortSignal) => {
    if (signal?.aborted) return
    
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    if (!ctx) return;

    try {
        if (signal?.aborted) return
        
        const dpr = window.devicePixelRatio || 1;

        const selectedImageIds = List?.value?.checkList || [];
        const selectedImages = [];
        for (const id of selectedImageIds) {
            const image = images.value.find(item => item.id === id);
            if (image) selectedImages.push(image);
        }

        // 限制最大拼接图片数量
        const maxImages = 100
        const limitedImages = selectedImages.slice(0, maxImages)
        
        const imageDataUrls = limitedImages.map(item => item.data);
        const imagesElements = await Promise.all(imageDataUrls.map(src => loadImage(src)));

        const imagesPerRow = getImagesPerRow();
        const totalImages = imagesElements.length;
        if (totalImages === 0) return;

        let canvasWidth = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = imagesElements.slice(i, i + imagesPerRow);
            const rowWidth = rowImages.reduce((sum, img) => sum + img.naturalWidth, 0);
            if (rowWidth > canvasWidth) canvasWidth = rowWidth;
        }

        let totalHeight = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = imagesElements.slice(i, i + imagesPerRow);
            const rowHeight = Math.max(...rowImages.map(img => img.naturalHeight));
            totalHeight += rowHeight;
        }

        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = totalHeight + 'px';
        canvas.width = canvasWidth * dpr;
        canvas.height = totalHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasWidth, totalHeight);

        let currentY = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = imagesElements.slice(i, i + imagesPerRow);
            const rowHeight = Math.max(...rowImages.map(img => img.naturalHeight));

            let currentX = 0;
            for (const img of rowImages) {
                ctx.drawImage(img, currentX, currentY, img.naturalWidth, img.naturalHeight);
                currentX += img.naturalWidth;
            }
            currentY += rowHeight;
        }

        stitchedImageUrl.value = canvas.toDataURL('image/png');

    } catch (error) {
        console.error('图片加载失败:', error);
    }
}

const getImagesPerRow = (): number => {
    if (!StitchingType[0]) return 0;
    if (!stitchingValue.value) {
        return StitchingType && StitchingType.length > 0 ? StitchingType[0].num : 6;
    }
    const selectedOption = StitchingType.find(item => item.name === stitchingValue.value);
    return selectedOption ? selectedOption.num : (StitchingType && StitchingType.length > 0 ? StitchingType[0].num : 6);
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// 优化预览列表获取
const getPreviewSrcListFromCurrent = (currentId: number) => {
    if (!List.value?.checkList) return []

    const currentIndex = List.value.checkList.indexOf(currentId)
    if (currentIndex === -1) return []

    const reorderedList = [
        ...List.value.checkList.slice(currentIndex),
        ...List.value.checkList.slice(0, currentIndex)
    ]

    return reorderedList.map(id => {
        const image = images.value.find(item => item.id === id)
        return image?.data || ''
    }).filter(url => url !== '')
}

// 组件卸载时清理
onUnmounted(() => {
  if (stitchingController) {
    stitchingController.abort()
  }
  clearImageCache()
})
</script>

<template>
    <div class="main-container">
        <!-- 左侧图片选择区域 -->
        <div class="left-panel">
            <el-card shadow="hover" class="flex-card">
                <template #header>
                    <div class="card-header">
                        <el-select v-model="value" placeholder="请选择" size="large" @change="clickTab" class="category-select">
                            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                        <el-button link type="text" class="image-count">
                            当前分类下共有<span class="count-number">{{ currentCategoryImages.length }}</span>张图片
                        </el-button>
                    </div>
                    <div>
                        <el-divider>
                            <el-icon><Star /></el-icon>
                        </el-divider>
                    </div>
                    <div class="action-bar">
                        <el-link :underline="false" class="hint-text">
                            温馨提示：点击图片即可选中，当前共选择
                            <el-link type="primary" :underline="false" class="selected-count">
                                {{ List?.checkList?.length || 0 }}
                            </el-link>
                            张图片。
                        </el-link>
                        <div class="button-group">
                            <el-button type="primary" round plain @click="selectAll" size="small">全选</el-button>
                            <el-button type="success" round plain @click="invertSelection" size="small">反选</el-button>
                            <el-button type="danger" round plain @click="clearSelection" size="small">清空</el-button>
                        </div>
                    </div>
                </template>
                <div class="image-grid-container" @scroll="onScroll">
                    <ImageView ref="List" :ImageInfo="paginatedImages" :total="currentCategoryImages.length" />
                    <div v-if="loading" class="loading-more">
                        <el-icon class="is-loading"><Loading /></el-icon>
                        加载中...
                    </div>
                    <div v-if="paginatedImages.length >= currentCategoryImages.length && currentCategoryImages.length > 0" 
                         class="load-complete">
                        已加载全部图片
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 右侧已选图片区域 -->
        <div class="right-panel">
            <el-card shadow="hover" class="flex-card selected-panel">
                <template #header>
                    <div class="panel-header">
                        <span class="panel-title">已选择的图片</span>
                    </div>
                    <div class="panel-subtitle">拖拽图片可调整顺序,点击缩略图可查看预览</div>
                </template>
                <div class="selected-list-container">
                    <div v-if="List?.checkList?.length === 0" class="empty-state">
                        <h3>当前未选择任何图片</h3>
                    </div>
                    <div v-else class="selected-items">
                        <draggable @change="onListChange" :list="List?.checkList" ghost-class="ghost"
                            chosen-class="chosenClass" animation="300" @start="drag=true" @end="drag=false"
                            item-key="id">
                            <template #item="{ element, index }" :key="element">
                                <div class="selected-item">
                                    <li>
                                        <span class="drag-handle">
                                            <el-image class="thumbnail" :src="getImageUrl(element)"
                                                :preview-src-list="getPreviewSrcListFromCurrent(element)" fit="cover"
                                                hide-on-click-modal preview-teleported lazy />
                                        </span>
                                        <span class="image-name">
                                            {{ getImageName(element) }}
                                        </span>
                                        <el-button @click="clickDelete(index)" text type="danger" :icon="CloseBold"
                                            circle size="small" class="delete-btn" />
                                    </li>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>
                <template #footer>
                    <div class="stitching-controls">
                        <el-select v-model="stitchingValue" clearable placeholder="请选择拼接方式" class="stitching-select">
                            <el-option v-for="item in StitchingType" :key="item.name" :label="item.name" :value="item.name" />
                        </el-select>
                        <el-button :disabled="List?.checkList.length == 0" @click="onStitching"
                            type="primary" round class="generate-btn">生成拼接图</el-button>
                    </div>
                </template>
            </el-card>
        </div>

        <!-- 拼接结果对话框 -->
        <div>
            <el-dialog v-model="dialogVisible" title="拼接结果" width="75%" draggable class="result-dialog">
                <el-divider />
                <div class="result-container">
                    <canvas id="canvas" ref="canvas" width="1" height="1" style="display: none;"></canvas>
                    <el-image v-if="stitchedImageUrl" :src="stitchedImageUrl" fit="contain" class="result-image"
                        :preview-src-list="[stitchedImageUrl]" hide-on-click-modal preview-teleported lazy />
                    <div v-else class="no-result">
                        <p>请先生成拼接图</p>
                    </div>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<style scoped>

.main-container {
    display: flex;
    gap: 16px;
    min-height: 600px;
}

.left-panel {
    flex: 4.75;
    min-width: 0; /* 防止flex元素溢出 */
}

.right-panel {
    flex: 2;
    min-width: 0;
}

/* 移动端布局 */
@media (max-width: 768px) {
    .main-container {
        flex-direction: column;
        gap: 12px;
    }
    
    .left-panel,
    .right-panel {
        flex: none;
        width: 100%;
    }
}

/* 卡片基础样式 */
.flex-card {
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-left: 3px solid #409EFF;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 头部区域响应式 */
.card-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 0 12px 0;
}

@media (min-width: 769px) {
    .card-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

.category-select {
    width: 100%;
}

@media (min-width: 769px) {
    .category-select {
        width: 200px;
    }
}

.image-count {
    white-space: nowrap;
}

.count-number {
    font-weight: bold;
    color: #409EFF;
    margin: 0 4px;
}

/* 操作栏 */
.action-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

@media (min-width: 480px) {
    .action-bar {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

.hint-text {
    font-size: 14px;
}

.selected-count {
    font-weight: bold;
    margin: 0 4px;
}

.button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

@media (max-width: 480px) {
    .button-group {
        justify-content: center;
    }
}

/* 图片网格容器 */
.image-grid-container {
    height: 400px;
    overflow-y: auto;
    padding: 4px;
}

@media (max-width: 768px) {
    .image-grid-container {
        height: 350px;
    }
}

/* 右侧面板样式 */
.panel-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.panel-title {
    font-weight: bold;
    font-size: 16px;
}

.panel-subtitle {
    font-size: 12px;
    color: #909399;
    text-align: left;
}

.selected-list-container {
    height: 300px;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .selected-list-container {
        height: 250px;
    }
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #909399;
}

.empty-state h3 {
    margin: 0;
    font-weight: normal;
}

/* 已选图片项 */
.selected-item {
    background: white;
    border: 1px solid #e1e8ed;
    border-radius: 6px;
    margin-bottom: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    cursor: grab;
    transition: all 0.2s ease;
}

.selected-item:hover {
    border-color: #3498db;
    transform: translateY(-1px);
}

.selected-item li {
    list-style: none;
    display: flex;
    align-items: center;
    width: 100%;
    color: #2c3e50;
    font-size: 14px;
}

.thumbnail {
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px;
}

.image-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0 8px;
    font-size: 13px;
}

.delete-btn {
    flex-shrink: 0;
}

@media (max-width: 480px) {
    .image-name {
        max-width: 120px;
        font-size: 12px;
    }
    
    .selected-item {
        padding: 6px 8px;
    }
}

/* 拼接控制区域 */
.stitching-controls {
    display: flex;
    gap: 12px;
    align-items: center;
}

.stitching-select {
    flex: 1;
}

.generate-btn {
    white-space: nowrap;
}

@media (max-width: 480px) {
    .stitching-controls {
        flex-direction: column;
        gap: 8px;
    }
    
    .stitching-select,
    .generate-btn {
        width: 100%;
    }
}

/* 加载状态 */
.loading-more, .load-complete {
    text-align: center;
    padding: 12px;
    color: #909399;
    font-size: 14px;
}

.loading-more .el-icon {
    margin-right: 4px;
}

/* 对话框样式 */
.result-dialog {
    border-radius: 8px;
}

@media (max-width: 768px) {
    .result-dialog {
        width: 95% !important;
        margin: 10px auto;
    }
}

.result-container {
    text-align: center;
}

.result-image {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 4px;
}

.no-result {
    padding: 40px 20px;
    color: #909399;
}

/* 拖拽状态 */
.chosenClass {
    background: #e3f2fd;
    transform: rotate(1deg);
}

.ghost {
    opacity: 0.5;
    background: #f8f9fa;
    border: 2px dashed #3498db;
}

/* 触摸优化 */
.el-button, .el-select, .selected-item {
    -webkit-tap-highlight-color: transparent;
}

.el-button {
    touch-action: manipulation;
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
    .el-card__header {
        padding: 12px;
    }
    
    .el-divider {
        margin: 12px 0;
    }
    
    .el-button {
        font-size: 12px;
        padding: 6px 10px;
    }
    
    .panel-title {
        font-size: 14px;
    }
}
</style>