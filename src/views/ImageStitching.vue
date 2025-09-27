<script setup lang="ts">
import { onMounted, ref, reactive, nextTick } from 'vue'
import { ImageType } from "../data/ImageType"
import { ImageInfo } from "../data/ImageInfo";
import { StitchingType } from "../data/StitchingType.ts";
import ImageView from "./ImageView.vue";
import CheckList from './ImageView.vue'
import { Star, CloseBold } from "@element-plus/icons-vue";
import draggable from 'vuedraggable';

interface ListItem {
    value: string
    label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
// 修改：设置默认值为第一个选项（全部）
const value = ref<string>('')

onMounted(() => {
    list.value = ImageType.map((item) => {
        return { value: `value:${item}`, label: `${item}` }
    })
    options.value = list.value
    
    // 修改：设置默认选中第一个选项（全部）
    if (options.value.length > 0 && options.value[0]) {
    value.value = options.value[0].value
    clickTab(value.value)
}
})

// 传值数据
const Images = reactive(ImageInfo.value.concat())
const getFilteredImages = (type: string) => {
    return type === '全部'
        ? Images
        : Images.filter((item: { type: string; }) => item.type === type)
}

const clickTab = (key: string) => {
    const filterType = key.replace('value:', '')
    const filtered = getFilteredImages(filterType)
    // 只更新显示，不覆盖原始数据
    ImageInfo.value.splice(0, ImageInfo.value.length, ...filtered)
}

const List = ref<InstanceType<typeof CheckList> | null>(null)
    
// 全选 - 当前分类
const selectAll = () => {
    if (List.value && ImageInfo.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = ImageInfo.value.map((item) => item.id);
        
        // 添加当前分类所有图片到已选列表
        currentCategoryIds.forEach(id => {
            currentSelected.add(id);
        });
        
        List.value.checkList = Array.from(currentSelected);
    }
};

// 反选 - 当前分类
const invertSelection = () => {
    if (List.value && ImageInfo.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = new Set(ImageInfo.value.map((item) => item.id));
        
        // 对当前分类的图片进行反选
        currentCategoryIds.forEach(id => {
            if (currentSelected.has(id)) {
                currentSelected.delete(id); // 已选则移除
            } else {
                currentSelected.add(id); // 未选则添加
            }
        });
        
        List.value.checkList = Array.from(currentSelected);
    }
};

// 清空 - 只清空当前分类的选中
const clearSelection = () => {
    if (List.value && ImageInfo.value) {
        const currentSelected = new Set(List.value.checkList || []);
        const currentCategoryIds = new Set(ImageInfo.value.map(item => item.id));
        
        // 只移除当前分类的选中
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
    // 从全局 Images 中查找，而不是当前分类的 ImageInfo
    const image = Images.find(item => item.id === id)
    return image?.name || '未知'
}

const clickDelete = (element: number) => {
    if (!List.value || !List.value.checkList) return;

    // 确保索引在有效范围内
    if (element < 0 || element >= List.value.checkList.length) return;

    // 获取要删除的元素的ID，以便同时更新复选框状态
    const deletedItemId = List.value.checkList[element].id;

    // 从已选择列表中移除指定索引的元素
    List.value.checkList.splice(element, 1);

    // 同时更新复选框组的选中状态
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
// 添加拼接图URL的ref
const stitchedImageUrl = ref('')

const onStitching = async () => {
    dialogVisible.value = true
    await nextTick() // 等待DOM更新，确保画布已经渲染
    draw()
}

const draw = async () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
    if (!ctx) return;

    try {
        const dpr = window.devicePixelRatio || 1;

        // 获取选中的图片ID列表
        const selectedImageIds = List?.value?.checkList || [];
        const selectedImages = [];
        for (const id of selectedImageIds) {
            // 修改这里：从全局 Images 中查找，而不是当前分类的 ImageInfo.value
            const image = Images.find(item => item.id === id);
            if (image) selectedImages.push(image);
        }

        const imageUrls = selectedImages.map(item => item.url);
        const images = await Promise.all(imageUrls.map(src => loadImage(src)));

        const imagesPerRow = getImagesPerRow();
        const totalImages = images.length;
        if (totalImages === 0) return;

        // 计算画布宽度：取每行图片原始宽度之和的最大值
        let canvasWidth = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = images.slice(i, i + imagesPerRow);
            const rowWidth = rowImages.reduce((sum, img) => sum + img.naturalWidth, 0);
            if (rowWidth > canvasWidth) canvasWidth = rowWidth;
        }

        // 计算画布总高度：每行高度为该行中图片的最大高度
        let totalHeight = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = images.slice(i, i + imagesPerRow);
            const rowHeight = Math.max(...rowImages.map(img => img.naturalHeight));
            totalHeight += rowHeight;
        }

        // 设置画布尺寸
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = totalHeight + 'px';
        canvas.width = canvasWidth * dpr;
        canvas.height = totalHeight * dpr;
        ctx.scale(dpr, dpr);

        // 设置背景
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasWidth, totalHeight);

        // 绘制图片
        let currentY = 0;
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = images.slice(i, i + imagesPerRow);
            const rowHeight = Math.max(...rowImages.map(img => img.naturalHeight));

            let currentX = 0;
            for (const img of rowImages) {
                ctx.drawImage(img, currentX, currentY, img.naturalWidth, img.naturalHeight);
                currentX += img.naturalWidth;
            }
            currentY += rowHeight;
        }

        // 将canvas转换为图片URL
        stitchedImageUrl.value = canvas.toDataURL('image/png');

    } catch (error) {
        console.error('图片加载失败:', error);
    }
}

// getImagesPerRow函数保持不变
const getImagesPerRow = (): number => {
    if (!StitchingType[0]) return 0;
    if (!stitchingValue.value) {
        return StitchingType && StitchingType.length > 0 ? StitchingType[0].num : 6;
    }
    const selectedOption = StitchingType.find(item => item.name === stitchingValue.value);
    return selectedOption ? selectedOption.num : (StitchingType && StitchingType.length > 0 ? StitchingType[0].num : 6);
}

// 图片加载辅助函数
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

const getImageUrl = (id: number) => {
    const image = Images.find(item => item.id === id)
    return image?.url || ''
}

// 获取单个图片的预览列表（从当前图片开始）
const getPreviewSrcListFromCurrent = (currentId: number) => {
    if (!List.value?.checkList) return []
    
    const currentIndex = List.value.checkList.indexOf(currentId)
    if (currentIndex === -1) return []
    
    const reorderedList = [
        ...List.value.checkList.slice(currentIndex),
        ...List.value.checkList.slice(0, currentIndex)
    ]
    
    return reorderedList.map(id => {
        const image = Images.find(item => item.id === id)
        return image?.url || ''
    }).filter(url => url !== '')
}
</script>

<template>
    <div style="display: flex;">
        <div style="flex: 4.75;">
            <el-card shadow="hover" gradient="true" class="flex-card">
                <template #header>
                    <div class="card-header">
                        <!-- 修改：移除clearable属性，确保有默认值 -->
                        <el-select v-model="value" placeholder="请选择" size="large" @change="clickTab">
                            <el-option v-for="item in options" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <el-button link type="text">当前选项共有<span style="font-weight: bold;color: #409EFF;">&nbsp;{{
                            ImageInfo.length }}&nbsp;</span>张图片</el-button>
                    </div>
                    <div>
                        <el-divider>
                            <el-icon>
                                <Star />
                            </el-icon></el-divider>
                    </div>
                    <div class="text">
                        <el-link :underline="false">当前共选择
                            <el-link type="primary" :underline="false">
                                <span style="font-weight: bold;">&nbsp;{{ List?.checkList?.length
                                }}&nbsp;</span> </el-link>
                            张图片
                        </el-link>
                        <div class="button-group">
                            <el-button type="primary" round plain @click="selectAll">全选</el-button>
                            <el-button type="success" round plain @click="invertSelection">反选</el-button>
                            <el-button type="danger" round plain @click="clearSelection">清空</el-button>
                        </div>
                    </div>
                </template>
                <div class="table-container1">
                    <ImageView ref="List" :ImageInfo="ImageInfo" />
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
                    <div style="font-size: small;color: #909399; text-align: left; ">拖拽图片可调整顺序</div>
                </template>
                <div class="table-container2">
                    <div v-if="List?.checkList?.length === 0">
                        <h3>当前未选择任何图片</h3>
                    </div>
                    <div v-else class="item">
                        <draggable @change="onListChange" :list="List?.checkList" ghost-class="ghost"
                            chosen-class="chosenClass" animation="300" @start="drag = true" @end="drag = false"
                            item-key="id">
                            <template #item="{ element, index }" :key="element.id">
                                <div class="draggable-item">
                                    <li>
                                        <span class="drag-handle">
                                            <el-image 
                                                class="thumbnail" 
                                                :src="getImageUrl(element)"
                                                :preview-src-list="getPreviewSrcListFromCurrent(element)"
                                                fit="cover"
                                                hide-on-click-modal
                                                preview-teleported
                                            />
                                        </span>
                                        <span class="image-name">{{ getImageName(element) }}</span>
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
                <ul v-infinite-scroll class="infinite-list2" style="overflow: auto">
                    <!-- 隐藏canvas，使用el-image展示拼接结果 -->
                    <canvas id="canvas" ref="canvas" width="1" height="1" style="display: none;"></canvas>
                    <el-image 
                        v-if="stitchedImageUrl" 
                        :src="stitchedImageUrl" 
                        fit="contain" 
                        style="max-width: 100%;"
                        :preview-src-list="[stitchedImageUrl]"
                        hide-on-click-modal
                        preview-teleported
                    />
                    <div v-else style="text-align: center; padding: 20px;">
                        <p>请先生成拼接图</p>
                    </div>
                </ul>
                <!-- <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                        <el-button 
                            v-if="stitchedImageUrl" 
                            type="primary" 
                            @click="dialogVisible = false"
                            :download="'stitched-image.png'"
                            :href="stitchedImageUrl"
                        >下载拼接图</el-button>
                    </span>
                </template> -->
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

/* 响应式设计 */
@media (max-width: 768px) {
    .container {
        max-width: 100%;
    }

    .card-header {
        padding: 12px 15px;
    }

    .table-container {
        padding: 15px;
    }
}

.chosenClass {
    background: #e3f2fd;
    transform: rotate(2deg);
}

/* 拖拽效果 */
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

.table-container1 {
    height: 300px;
}

.table-container2 {
    height: 300px;
}

/* .table-container3 {
    overflow: auto;
} */

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
</style>
