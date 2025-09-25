<script setup lang="ts">
import { onMounted, ref, reactive, nextTick } from 'vue'
import { ImageType } from "../data/ImageType"
import { ImageInfo } from "../data/ImageInfo";
import { StitchingType } from "../data/StitchingType.ts";
import ImageView from "./ImageView.vue";
import CheckList from './ImageView.vue'
import { Star, CloseBold, Picture } from "@element-plus/icons-vue";
import draggable from 'vuedraggable';

interface ListItem {
    value: string
    label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string[]>([])

onMounted(() => {
    list.value = ImageType.map((item) => {
        return { value: `value:${item}`, label: `${item}` }
    })
    options.value = list.value
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
    ImageInfo.value.splice(0, ImageInfo.value.length, ...filtered)
}

const List = ref<InstanceType<typeof CheckList> | null>(null)

// 全选
const selectAll = () => {
    if (List.value && ImageInfo) {
        List.value.checkList = ImageInfo.value.map((item: { id: any; }) => item.id);
    }
};
// 反选
const invertSelection = () => {
    if (List.value && ImageInfo) {
        const currentSelected = new Set(List.value.checkList);
        const allIds = ImageInfo.value.map((item: { id: any; }) => item.id || item);

        List.value.checkList = allIds.filter((id: any) => !currentSelected.has(id));
    }
};

// 清空
const clearSelection = () => {
    if (List.value) {
        List.value.checkList = [];
    }
};

const drag = ref(true)

const onListChange = (event: any) => {
    console.log('List changed:', event)
}
const getImageName = (id: number) => {
    const image = ImageInfo.value.find(item => item.id === id)
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
        // 获取选中的图片ID列表
        const selectedImageIds = List?.value?.checkList || [];

        // 根据拖拽排序后的ID顺序获取图片数据
        const selectedImages = [];
        for (const id of selectedImageIds) {
            const image = ImageInfo.value.find(item => item.id === id);
            if (image) {
                selectedImages.push(image);
            }
        }

        // 提取图片URL
        const imageUrls = selectedImages.map(item => item.url);

        const images = await Promise.all(imageUrls.map(src => loadImage(src)));

        // 获取用户选择的每行图片数量
        const imagesPerRow = getImagesPerRow();

        const totalImages = images.length;

        // 如果没有选择任何图片，直接返回
        if (totalImages === 0) {
            console.log('没有选择任何图片');
            return;
        }

        // 动态计算单元格尺寸
        const cellWidth = Math.floor(canvas.width / imagesPerRow);

        // 计算总高度
        let totalUsedHeight = 0;

        // 先计算总高度（不实际绘制）
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = images.slice(i, i + imagesPerRow);

            let maxHeightRatio = 0;
            for (const img of rowImages) {
                const ratio = img.height / img.width;
                if (ratio > maxHeightRatio) {
                    maxHeightRatio = ratio;
                }
            }

            const rowHeight = Math.floor(cellWidth * maxHeightRatio);
            totalUsedHeight += rowHeight;
        }

        // 设置canvas高度为计算出的总高度
        canvas.height = totalUsedHeight;

        // 使用黑色背景填充整个画布
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 重新初始化变量进行实际绘制
        totalUsedHeight = 0;

        // 实际绘制图片
        for (let i = 0; i < totalImages; i += imagesPerRow) {
            const rowImages = images.slice(i, i + imagesPerRow);

            let maxHeightRatio = 0;
            for (const img of rowImages) {
                const ratio = img.height / img.width;
                if (ratio > maxHeightRatio) {
                    maxHeightRatio = ratio;
                }
            }

            const rowHeight = Math.floor(cellWidth * maxHeightRatio);

            // 绘制当前行的所有图片
            for (let j = 0; j < rowImages.length; j++) {
                const img = rowImages[j] as HTMLImageElement;
                const col = j;

                const scale = cellWidth / img.width;
                const scaledWidth = cellWidth;
                const scaledHeight = Math.floor(img.height * scale);

                const x = Math.floor(col * cellWidth);
                const y = totalUsedHeight + Math.floor((rowHeight - scaledHeight) / 2);

                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            }

            totalUsedHeight += rowHeight;
        }

    } catch (error) {
        console.error('图片加载失败:', error);
    }
}

// 获取每行图片数量的函数
const getImagesPerRow = (): number => {
    if (!StitchingType[0]) return 0;
    if (!stitchingValue.value) {
        // 如果没有选择，默认使用第一个选项（添加空数组检查）
        return StitchingType && StitchingType.length > 0 ? StitchingType[0].num : 6; // 默认6张
    }

    // 根据用户选择的下拉框值查找对应的数量
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
</script>

<template>
    <div style="display: flex;">
        <div style="flex: 4;">
            <el-card shadow="hover" gradient="true" class="flex-card">
                <template #header>
                    <div class="card-header">
                        <el-select v-model="value" clearable placeholder="请选择" size="large" @change="clickTab">
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
        <div style="flex: 0.25;"></div>
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
                                        <span class="drag-handle"><el-icon>
                                                <Picture />
                                            </el-icon></span>
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
                    <canvas id="canvas" ref="canvas" width="800" height="1"></canvas>
                </ul>
                <!-- <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="dialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="dialogVisible = false">下载</el-button>
                    </span>
                </template> -->
            </el-dialog>
        </div>
    </div>
</template>

<style scoped>
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
