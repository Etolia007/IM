<template>
    <div class="image-manager">
        <el-card shadow="hover" class="manager-card">
            <el-tabs type="border-card" @tab-change="tabChange" v-model="activeTab" class="responsive-tabs" lazy>
                <el-tab-pane v-for="(state, index) in ImageType" :key="index" :label="state" :name="index.toString()">

                    <div class="action-bar">
                        <el-button type="primary" @click="onUpload" :icon="Upload" class="upload-btn">
                            <span class="btn-text">上传图片</span>
                        </el-button>
                        <el-input v-model="search" placeholder="输入关键词检索" clearable class="search-input"
                            @input="handleSearchDebounced">
                            <template #append>
                                <el-button :icon="Search" @click="handleSearch" />
                            </template>
                        </el-input>
                    </div>

                    <!-- 桌面视图 -->
                    <div class="desktop-view">
                        <el-table 
                            :data="currentPageImages" 
                            style="width: 100%;" 
                            :header-cell-style="{ 'text-align': 'center' }"
                            :cell-style="{ 'text-align': 'center'}" 
                            row-key="id"
                            v-loading="tableLoading"
                            :element-loading-svg="LoadingSvg"
                            element-loading-svg-view-box="-10, -10, 50, 50"
                            :row-style="{ height: '160px' }">
                            <el-table-column label="图片" prop="image" width="250" align="center">
                                <template #default="scope">
                                    <div class="image-container">
                                        <el-image 
                                            :src="scope.row.data" 
                                            alt="图片" 
                                            class="adaptive-image"
                                            loading="lazy"
                                            :preview-src-list="getPreviewSrcList(scope.$index)"
                                            hide-on-click-modal
                                            preview-teleported
                                        />
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="名称" prop="name" width="250" show-overflow-tooltip align="center">
                                <template #default="scope">
                                    <div class="name-cell">
                                        <el-tag size="large" effect="plain">{{ scope.row.name }}</el-tag>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="上传日期" prop="uploadedAt" width="150" sortable align="center">
                                <template #default="scope">
                                    <div class="date-cell">
                                        {{ formatDate(scope.row.uploadedAt) }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="150" align="center">
                                <template #default="scope">
                                    <div class="action-cell">
                                        <el-popconfirm title="确认要删除该图片吗？" confirm-button-text="确定" cancel-button-text="取消"
                                            @confirm="handleDelete(scope.row.id)">
                                            <template #reference>
                                                <el-button type="danger" :icon="Delete" circle />
                                            </template>
                                        </el-popconfirm>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>

                    <!-- 移动端视图 -->
                    <div class="mobile-view">
                        <div class="image-cards">
                            <div v-for="(item, index) in currentPageImages" :key="item.id" class="image-card">
                                <div class="card-image">
                                    <el-image 
                                        :src="item.data" 
                                        alt="图片" 
                                        fit="contain" 
                                        class="mobile-image"
                                        loading="lazy"
                                        :preview-src-list="getPreviewSrcList(index)"
                                        hide-on-click-modal
                                        preview-teleported
                                    />
                                </div>
                                <div class="card-content">
                                    <div class="card-info">
                                        <div class="image-name">{{ item.name }}</div>
                                        <div class="image-filename">文件: {{ item.filename }}</div>
                                        <div class="image-date">{{ formatDate(item.uploadedAt) }}</div>
                                        <div class="image-type">类别: {{ item.type }}</div>
                                    </div>
                                    <div class="card-actions">
                                        <el-popconfirm title="确认要删除该图片吗？" confirm-button-text="确定"
                                            cancel-button-text="取消" @confirm="handleDelete(item.id)">
                                            <template #reference>
                                                <el-button type="danger" :icon="Delete" size="small">删除</el-button>
                                            </template>
                                        </el-popconfirm>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 分页组件 -->
                    <el-config-provider :locale="zhCn">
                        <el-pagination 
                            v-model:current-page="currentPage" 
                            v-model:page-size="pageSize"
                            :page-sizes="pageSizes" 
                            :small="small" 
                            :disabled="disabled" 
                            :background="background"
                            layout="total, sizes, prev, pager, next, jumper" 
                            :total="filteredImages.length"
                            @size-change="handleSizeChange" 
                            @current-change="handleCurrentChange"
                            class="responsive-pagination" />
                    </el-config-provider>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { db, loadImages, images } from '../../db';
import { loadImagesFromDatabase } from '../../data/ImageInfo';
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Search, Delete, Upload } from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ImageType } from "../../data/ImageType";
import router from "../../router";
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash-es';

// SVG加载动画
const LoadingSvg = `
  <path class="path" d="
    M 30 15
    L 28 17
    M 25.61 25.61
    A 15 15, 0, 0, 1, 15 30
    A 15 15, 0, 1, 1, 27.99 7.5
    L 15 15
  " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
`;

const activeTab = ref("0");
const search = ref("");
const tableLoading = ref(false);

// 响应式判断
const isMobile = ref(window.innerWidth <= 768);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};

// 分页相关
const currentPage = ref(1);
const pageSize = ref(15);
const small = ref(false);
const background = ref(true);
const disabled = ref(false);

// 当前页数据
const currentPageImages = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredImages.value.slice(start, end);
});

// 防抖搜索
const handleSearchDebounced = debounce(() => {
    currentPage.value = 1;
}, 300);

const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${month}-${day}`;
};

const handleDelete = async (id: number | undefined) => {
    if (id === undefined) {
        ElMessage.error("删除失败：图片ID不存在");
        return;
    }
    try {
        tableLoading.value = true;
        await db.images.delete(id);
        await loadImages();
        await loadImagesFromDatabase();
        ElMessage.success("删除成功！");
    } catch (error) {
        console.error('删除图片失败:', error);
        ElMessage.error("删除失败！");
    } finally {
        tableLoading.value = false;
    }
};

const getImageData = (tabIndex: string) => {
    const index = parseInt(tabIndex);
    if (index === 0) return images.value;
    const typeName = ImageType[index];
    return images.value.filter(image => image.type === typeName);
};

// 使用计算属性缓存过滤结果
const filteredImages = computed(() => {
    const tabImages = getImageData(activeTab.value);
    if (!search.value.trim()) return tabImages;
    const searchTerm = search.value.toLowerCase();
    return tabImages.filter(image => image.name?.toLowerCase().includes(searchTerm));
});

// 图片预览列表（按需生成）
const getPreviewSrcList = (index: number) => {
    return currentPageImages.value.slice(index).map(item => item.data);
};

const pageSizes = computed(() => {
    const total = filteredImages.value.length;
    const baseSizes = [5, 15, 30, 50];
    if (total > 50) return [...new Set([...baseSizes, total])].sort((a, b) => a - b);
    return baseSizes;
});

const handleSearch = () => {
    currentPage.value = 1;
};

const handleCurrentChange = (val: number) => {
    currentPage.value = val;
    // 滚动到顶部
    const container = document.querySelector('.image-manager');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
    }
};

const handleSizeChange = (val: number) => {
    pageSize.value = val;
    currentPage.value = 1;
};

const onUpload = () => router.push({ name: "UploadImage", params: { entryMethod: "Upload" } });

const tabChange = () => {
    currentPage.value = 1;
    search.value = "";
};

// 监听窗口大小变化
onMounted(() => {
    loadImages();
    window.addEventListener('resize', updateIsMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
    handleSearchDebounced.cancel();
});
</script>

<style scoped>
/* 解决因show-overflow-tooltip导致的不居中 */
:deep(.el-table tr .el-table__cell .cell){
    width: 100% !important;
}
.image-manager {
    padding: 8px;
}

.manager-card {
    border-radius: 8px;
}

.action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    padding: 0 8px;
    flex-wrap: wrap;
}

.upload-btn {
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    min-width: 200px;
}

.btn-text {
    margin-left: 4px;
}

.desktop-view {
    display: block;
}

.mobile-view {
    display: none;
}

.image-cards {
    display: grid;
    gap: 12px;
    padding: 0 4px;
}

.image-card {
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    background: white;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-image {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e8ed;
}

.mobile-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
}

.card-content {
    padding: 12px;
}

.card-info {
    margin-bottom: 12px;
}

.image-name {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 4px;
    color: #2c3e50;
}

.image-filename,
.image-date,
.image-type {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
}

.card-actions {
    text-align: center;
}

.responsive-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

/* 修复表格对齐问题 */
.image-container {
    width: 100%;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin: 0 auto;
}

.adaptive-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
}

.name-cell,
.date-cell,
.action-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 140px;
}

.name-cell .el-tag {
    margin: 0;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 表格行高统一 */
:deep(.el-table .el-table__cell) {
    padding: 8px 0;
    vertical-align: middle;
}

:deep(.el-table .el-table__row) {
    height: 160px;
}

:deep(.el-table .el-table__body tr:hover > td) {
    background-color: #f5f7fa;
}

.responsive-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 8px;
}

.responsive-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 14px;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .image-manager {
        padding: 4px;
    }

    .action-bar {
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
    }

    .search-input {
        min-width: 100%;
    }

    .btn-text {
        display: inline;
    }

    .desktop-view {
        display: none;
    }

    .mobile-view {
        display: block;
    }

    .image-cards {
        grid-template-columns: 1fr;
    }

    .card-image {
        height: 180px;
    }

    .responsive-pagination {
        padding: 0 8px;
    }
    
    .responsive-pagination :deep(.el-pagination) {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .responsive-pagination :deep(.el-pagination__total),
    .responsive-pagination :deep(.el-pagination__sizes),
    .responsive-pagination :deep(.el-pagination__jump) {
        margin-top: 8px;
        flex: 1;
        text-align: center;
        justify-content: center;
    }
    
    .responsive-pagination :deep(.btn-prev),
    .responsive-pagination :deep(.btn-next),
    .responsive-pagination :deep(.el-pager) {
        display: flex;
        justify-content: center;
    }

    .responsive-tabs :deep(.el-tabs__item) {
        padding: 0 8px;
        font-size: 12px;
    }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .action-bar {
        padding: 0 4px;
    }

    .card-image {
        height: 160px;
    }

    .image-name {
        font-size: 14px;
    }

    .card-content {
        padding: 8px;
    }

    .responsive-pagination :deep(.el-pagination) {
        flex-direction: column;
        align-items: center;
    }
    
    .responsive-pagination :deep(.el-pagination__total) {
        order: -1;
        margin-bottom: 8px;
    }
    
    .responsive-pagination :deep(.el-pagination__sizes) {
        margin: 8px 0;
    }
}

/* 表格样式优化 */
.el-table th .gutter {
    display: table-cell !important;
}

:deep(.el-card__body) {
    padding: 0px;
}

@media (max-width: 768px) {
    :deep(.el-card__body) {
        padding: 0px;
    }
}

/* 加载动画 */
:deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.8);
}

:deep(.el-loading-spinner .path) {
    stroke: #409EFF;
    stroke-width: 4px;
}
</style>