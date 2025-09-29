<template>
    <div class="image-manager">
        <el-card shadow="hover" class="manager-card">
            <el-tabs type="border-card" @tab-change="tabChange" v-model="activeTab" class="responsive-tabs">
                <el-tab-pane v-for="(state, index) in ImageType" :key="index" :label="state" :name="index.toString()">
                    <!-- 操作栏 -->
                    <div class="action-bar">
                        <el-button type="primary" @click="onUpload" :icon="Upload" class="upload-btn">
                            <span class="btn-text">上传图片</span>
                        </el-button>
                        <el-input v-model="search" placeholder="输入关键词检索" clearable class="search-input">
                            <template #append>
                                <el-button :icon="Search" @click="handleSearch" />
                            </template>
                        </el-input>
                    </div>

                    <!-- PC端表格视图 -->
                    <div class="desktop-view">
                        <el-table :data="filteredImages.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
                            style="width: 100%;" :header-cell-style="{ 'text-align': 'center' }"
                            :cell-style="{ 'text-align': 'center' }" row-key="id" lazy>
                            <el-table-column label="图片" prop="image" width="250">
                                <template #default="scope">
                                    <div class="image-container">
                                        <el-image lazy :src="scope.row.data" alt="图片" class="adaptive-image" />
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="名称" prop="name" width="250">
                                <template #default="scope">
                                    <el-popover effect="light" trigger="hover" placement="top" width="auto">
                                        <template #default>
                                            <div>文件名：{{ scope.row.filename }}</div>
                                            <div>类别：{{ scope.row.type }}</div>
                                        </template>
                                        <template #reference>
                                            <el-tag size="large" effect="plain">{{ scope.row.name }}</el-tag>
                                        </template>
                                    </el-popover>
                                </template>
                            </el-table-column>
                            <el-table-column label="上传日期" prop="uploadedAt" width="150" sortable>
                                <template #default="scope">
                                    {{ formatDate(scope.row.uploadedAt) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" width="150">
                                <template #default="scope">
                                    <el-popconfirm title="确认要删除该图片吗？" confirm-button-text="确定" cancel-button-text="取消"
                                        @confirm="handleDelete(scope.row.id)">
                                        <template #reference>
                                            <el-button type="danger" :icon="Delete" circle />
                                        </template>
                                    </el-popconfirm>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>

                    <!-- 移动端卡片视图 -->
                    <div class="mobile-view">
                        <div class="image-cards">
                            <div v-for="item in filteredImages.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
                                :key="item.id" class="image-card">
                                <div class="card-image">
                                    <el-image lazy :src="item.data" alt="图片" fit="contain" class="mobile-image" />
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

                    <!-- 分页 -->
                    <el-config-provider :locale="zhCn">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="pageSizes" :small="small" :disabled="disabled" :background="background"
                            layout="total, sizes, prev, pager, next, jumper" :total="filteredImages.length"
                            @size-change="handleSizeChange" @current-change="handleCurrentChange"
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
import { ref, computed, onMounted } from "vue";
import { Search, Delete, Upload } from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ImageType } from "../../data/ImageType";
import router from "../../router";
import { ElMessage } from 'element-plus';

const activeTab = ref("0");
const search = ref("");

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
        await db.images.delete(id);
        await loadImages();
        await loadImagesFromDatabase();
        ElMessage.success("删除成功！");
    } catch (error) {
        console.error('删除图片失败:', error);
        ElMessage.error("删除失败！");
    }
};

const getImageData = (tabIndex: string) => {
    const index = parseInt(tabIndex);
    if (index === 0) return images.value;
    const typeName = ImageType[index];
    return images.value.filter(image => image.type === typeName);
};

const filteredImages = computed(() => {
    const tabImages = getImageData(activeTab.value);
    if (!search.value.trim()) return tabImages;
    const searchTerm = search.value.toLowerCase();
    return tabImages.filter(image => image.name?.toLowerCase().includes(searchTerm));
});

const pageSizes = computed(() => {
    const total = filteredImages.value.length;
    const baseSizes = [5, 15, 30];
    if (total > 30) return [...new Set([...baseSizes, total])].sort((a, b) => a - b);
    return baseSizes;
});

const handleSearch = () => currentPage.value = 1;

const small = ref(false);
const background = ref(false);
const disabled = ref(false);
const currentPage = ref(1);
const pageSize = ref(15);

const handleCurrentChange = (val: number) => currentPage.value = val;
const handleSizeChange = (val: number) => {
    pageSize.value = val;
    currentPage.value = 1;
};

const onUpload = () => router.push({ name: "UploadImage", params: { entryMethod: "Upload" } });
const tabChange = () => {
    currentPage.value = 1;
    search.value = "";
}

onMounted(() => loadImages());
</script>

<style scoped>
.image-manager {
    padding: 8px;
}

.manager-card {
    border-radius: 8px;
}

/* 操作栏响应式 */
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

/* 桌面视图 */
.desktop-view {
    display: block;
}

.mobile-view {
    display: none;
}

/* 移动端卡片视图 */
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

/* 响应式分页 */
.responsive-pagination {
    margin-top: 16px;
    overflow-x: auto;
}

/* 图片容器 */
.image-container {
    width: auto;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.adaptive-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
}

/* 标签样式 */
.responsive-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0 8px;
}

.responsive-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 14px;
}

/* 移动端样式 */
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

    /* 移动端显示卡片，隐藏表格 */
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

    /* 移动端分页优化 */
    .responsive-pagination :deep(.el-pagination) {
        justify-content: center;
        flex-wrap: wrap;
    }

    .responsive-pagination :deep(.el-pagination__sizes),
    .responsive-pagination :deep(.el-pagination__jump) {
        margin-top: 8px;
    }

    /* 标签优化 */
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

    .responsive-pagination :deep(.el-pagination__total) {
        display: none;
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
</style>