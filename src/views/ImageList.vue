<template>
    <div>
        <el-card shadow="hover">
            <el-tabs type="border-card" @tab-change="tabChange" v-model="activeTab">
                <el-tab-pane v-for="(state, index) in ImageType" :key="index" :label="state" :name="index.toString()">
                    <div class="left-layout">
                        <el-button type="primary" @click="onUpload" :icon="Upload">
                            <span>上传图片</span>
                        </el-button>
                        <el-button type="danger" @click="showDeleteDialog" :icon="Delete"
                            :disabled="selectedImages.length === 0">
                            <span>批量删除 ({{ selectedImages.length }})</span>
                        </el-button>
                    </div>
                    <el-input v-model="search" placeholder="输入关键词检索" clearable class="input-with-select">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch" />
                        </template>
                    </el-input>
                    <el-table :data="filteredImages.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
                        style="width: 100%;" :header-cell-style="{ 'text-align': 'center' }"
                        :cell-style="{ 'text-align': 'center' }" @selection-change="handleSelectionChange" row-key="id">
                        <el-table-column type="selection" width="55" :reserve-selection="true" />
                        <el-table-column label="图片" prop="image" width="250" fixed="left">
                            <template #default="scope">
                                <div class="image-container">
                                    <img :src="scope.row.data" alt="图片" class="adaptive-image" />
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="名称" prop="name" width="250">
                            <template #default="scope">
                                <el-popover effect="light" trigger="hover" placement="top" width="auto">
                                    <template #default>
                                        <div>name: {{ scope.row.name }}</div>
                                        <div>filename: {{ scope.row.filename }}</div>
                                    </template>
                                    <template #reference>
                                        <el-tag size="large" effect="plain">{{ scope.row.name }}</el-tag>
                                    </template>
                                </el-popover>
                            </template>
                        </el-table-column>
                        <el-table-column label="上传日期" prop="uploadedAt" width="150">
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
                    <el-config-provider :locale="zhCn">
                        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                            :page-sizes="pageSizes" :small="small" :disabled="disabled" :background="background"
                            layout="total, sizes, prev, pager, next, jumper" :total="filteredImages.length"
                            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                    </el-config-provider>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <el-dialog v-model="centerDialogVisible" title="警告" width="30%" center>
            <span>确认要删除选中的 {{ selectedImages.length }} 张图片吗？此操作不可恢复。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="centerDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="confirmDeleteAll">确认</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { db, loadImages, images } from '../db';
import { loadImagesFromDatabase } from '../data/ImageInfo';
import { ref, computed, onMounted } from "vue";
import { Search, Delete, Upload } from "@element-plus/icons-vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ImageType } from "../data/ImageType";
import router from "../router";
import { ElMessage } from 'element-plus';

const centerDialogVisible = ref(false)
const activeTab = ref("0");
const search = ref("");
const selectedImages = ref<any[]>([]);

const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}-${month}-${day}`;
};

const handleSelectionChange = (selection: any[]) => {
    selectedImages.value = selection;
};

const handleDelete = async (id: number) => {
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

const showDeleteDialog = () => {
    if (selectedImages.value.length === 0) {
        ElMessage.warning("请先选择要删除的图片！");
        return;
    }
    centerDialogVisible.value = true;
};

const confirmDeleteAll = async () => {
    try {
        const deletePromises = selectedImages.value.map(image => db.images.delete(image.id));
        await Promise.all(deletePromises);
        await loadImages();
        await loadImagesFromDatabase();
        selectedImages.value = [];
        centerDialogVisible.value = false;
        ElMessage.success(`成功删除 ${deletePromises.length} 张图片！`);
    } catch (error) {
        console.error('批量删除图片失败:', error);
        ElMessage.error("批量删除失败！");
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
    const baseSizes = [3, 5, 7, 10];
    if (total > 10) return [...new Set([...baseSizes, total])].sort((a, b) => a - b);
    return baseSizes;
});

const handleSearch = () => currentPage.value = 1;

const small = ref(false);
const background = ref(false);
const disabled = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

const handleCurrentChange = (val: number) => currentPage.value = val;
const handleSizeChange = (val: number) => {
    pageSize.value = val;
    currentPage.value = 1;
};

const onUpload = () => router.push({ name: "UploadImage", params: { entryMethod: "Upload" } });
const tabChange = () => {
    currentPage.value = 1;
    search.value = "";
    selectedImages.value = [];
}

onMounted(() => loadImages());
</script>

<style scoped>
.image-container {
    width: 250px;
    height: 150px;
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

.el-table th .gutter {
    display: table-cell !important;
}

:deep(.el-card__body) {
    padding: 0;
}

.el-pagination {
    justify-content: center;
    margin-top: 20px;
}

.left-layout {
    float: left;
    margin: 15px;
}

.input-with-select {
    width: 300px;
    float: right;
    margin: 15px;
}

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

.type,
.filename,
.date {
    color: #666;
    font-size: 12px;
}
</style>