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
    <div style="display: flex;">
        <div style="flex: 4.75;">
            <el-card shadow="hover" gradient="true" class="flex-card">
                <template #header>
                    <div class="card-header">
                        <el-select v-model="value" placeholder="请选择" size="large" @change="clickTab">
                            <el-option v-for="item in options" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <el-button link type="text">当前分类下共有<span style="font-weight: bold;color: #409EFF;">&nbsp;{{
                            currentCategoryImages.length }}&nbsp;</span>张图片</el-button>
                    </div>
                    <div>
                        <el-divider>
                            <el-icon>
                                <Star />
                            </el-icon></el-divider>
                    </div>
                    <div class="text">
                        <el-link :underline="false">温馨提示：点击图片即可选中，当前共选择
                            <el-link type="primary" :underline="false">
                                <span style="font-weight: bold;">&nbsp;{{ List?.checkList?.length
                                }}&nbsp;</span> </el-link>
                            张图片。
                        </el-link>
                        <div class="button-group">
                            <el-button type="primary" round plain @click="selectAll">全选</el-button>
                            <el-button type="success" round plain @click="invertSelection">反选</el-button>
                            <el-button type="danger" round plain @click="clearSelection">清空</el-button>
                        </div>
                    </div>
                </template>
                <div class="table-container1" @scroll="onScroll">
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
        <div style="flex: 0.1;"></div>
        <div style="flex: 2">
            <el-card shadow="hover" class="flex-card">
                <template #header>
                    <div class="card-header">
                        <span style="font-weight: bold;">已选择的图片</span>
                    </div>
                    <div style="font-size: small;color: #909399; text-align: left; ">拖拽图片可调整顺序,点击缩略图可查看预览</div>
                </template>
                <div class="table-container2">
                    <div v-if="List?.checkList?.length === 0">
                        <h3>当前未选择任何图片</h3>
                    </div>
                    <div v-else class="item">
                        <draggable @change="onListChange" :list="List?.checkList" ghost-class="ghost"
                            chosen-class="chosenClass" animation="300" @start="drag=true" @end="drag=false"
                            item-key="id">
                            <template #item="{ element, index }" :key="element">
                                <div class="draggable-item">
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
                                            circle />
                                    </li>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>
                <template #footer>
                    <el-row>
                        <el-col :span="14">
                            <el-select v-model="stitchingValue" clearable placeholder="请选择拼接方式">
                                <el-option v-for="item in StitchingType" :key="item.name" :label="item.name"
                                    :value="item.name" />
                            </el-select>
                        </el-col>
                        <el-col :span="2">
                            <div />
                        </el-col>
                        <el-col :span="8"><el-button :disabled="List?.checkList.length == 0" @click="onStitching"
                                type="primary" round>生成拼接图</el-button></el-col>
                    </el-row>
                </template>
            </el-card>
        </div>

        <div>
            <el-dialog v-model="dialogVisible" title="拼接结果" width="75%" draggable>
                <el-divider />
                <ul class="infinite-list2" style="overflow: auto">
                    <canvas id="canvas" ref="canvas" width="1" height="1" style="display: none;"></canvas>
                    <el-image v-if="stitchedImageUrl" :src="stitchedImageUrl" fit="contain" style="max-width: 100%;"
                        :preview-src-list="[stitchedImageUrl]" hide-on-click-modal preview-teleported lazy />
                    <div v-else style="text-align: center; padding: 20px;">
                        <p>请先生成拼接图</p>
                    </div>
                </ul>
            </el-dialog>
        </div>
    </div>
</template>

<style scoped>
.thumbnail {
    width: 30px;
    height: 30px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px;
}

canvas {
    border: 1px solid;
}

.el-card__footer {
    padding: 15px 20px;
    background: #f8f9fa;
    border-top: 1px solid #e1e8ed;
    border-radius: 0 0 12px 12px;
}

.el-card__footer h1 {
    text-align: center;
    color: #7f8c8d;
    font-size: 1.1rem;
    font-weight: 500;
}

@media (max-width: 768px) {
    .container {
        max-width: 100%;
    }

    .card-header {
        padding: 12px 15px;
    }

    .table-container1 {
        padding: 15px;
    }
}

.chosenClass {
    background: #e3f2fd;
    transform: rotate(2deg);
}

.ghost {
    opacity: 0.6;
    background: #f8f9fa;
    border: 2px dashed #3498db;
}

.draggable-item {
    background: white;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    margin-bottom: 10px;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    cursor: grab;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.draggable-item:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
    transform: translateY(-2px);
}

.draggable-item:active {
    cursor: grabbing;
}

.draggable-item li {
    list-style: none;
    display: flex;
    align-items: center;
    width: 100%;
    color: #2c3e50;
    font-weight: 500;
}

.drag-handle {
    margin-right: 12px;
    font-size: 1.4rem;
    color: #7f8c8d;
    cursor: move;
}

.image-name {
    flex: 1;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    max-width: 150px;
}

@media (max-width: 768px) {
    .image-name {
        max-width: 100px;
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    .image-name {
        max-width: 80px;
        font-size: 0.8rem;
    }
}

.draggable-item li {
    list-style: none;
    display: flex;
    align-items: center;
    width: 100%;
    color: #2c3e50;
    font-weight: 500;
    min-width: 0;
    overflow: hidden;
}

.flex-card {
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    flex: 1;
    border-left: 5px double #409EFF;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.flex-card:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
    transform: translateY(-5px);
}

.flex-card :deep(.el-card__body) {
    flex: 1;
    overflow: auto;
}

.table-container2 {
    height: 300px;
}

.card-container {
    height: 300px;
}

.infinite-list {
    height: 300px;
    padding: 0;
    margin: 0;
    list-style: none;
}

.infinite-list2 {
    height: 400px;
    padding: 0;
    margin: 0;
    list-style: none;
}

.infinite-list .infinite-list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    background: var(--el-color-primary-light-9);
    margin: 10px;
    color: var(--el-color-primary);
}

.infinite-list .infinite-list-item+.list-item {
    margin-top: 10px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 15px 0;
    position: relative;
}

.text {
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.item {
    margin-bottom: 18px;
}

/* 新增样式 */
.loading-more, .load-complete {
    text-align: center;
    padding: 10px;
    color: #909399;
    font-size: 14px;
}

.table-container1 {
    padding:5px;
    height: 300px;
    overflow-y: auto;
    overflow-x: hidden; /* 隐藏滚动条 */
}
</style>