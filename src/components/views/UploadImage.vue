<template>
    <div>
        <!-- 卡片 -->
        <el-card shadow="hover">
            <template #header>
                <div class="card-header">
                    <span class="text">上传图片</span>
                </div>
            </template>

            <!-- 图片上传表单 -->
            <el-form ref="uploadForm" :model="formData" :rules="rules" label-width="100px" :size="formSize">
                <div class="form-content">
                    <div class="form-left">
                        <el-form-item label="图片类别:" prop="imageType">
                            <el-select v-model="formData.imageType" clearable placeholder="请选择图片类别"
                                style="width: 100%; max-width: 300px;">
                                <el-option v-for="item in filteredImageTypes" :key="item" :label="item" :value="item" />
                            </el-select>
                        </el-form-item>

                        <!-- 上传进度和状态信息 -->
                        <div class="upload-info" v-if="uploading || uploadStatus.message">
                            <div class="upload-progress" v-if="uploading">
                                <el-progress :percentage="uploadProgress"
                                    :status="uploadProgress === 100 ? 'success' : ''" :stroke-width="8" />
                                <div class="progress-text">
                                    正在上传 {{ currentUploadIndex + 1 }}/{{ fileList.length }} - {{ uploadStatus.message }}
                                </div>
                            </div>

                            <!-- 上传状态 -->
                            <div class="upload-status"
                                :class="{ 'success': uploadStatus.success, 'error': uploadStatus.error }"
                                v-if="uploadStatus.message">
                                {{ uploadStatus.message }}
                            </div>
                        </div>
                    </div>

                    <div class="form-right">
                        <el-form-item label="图片文件:" prop="imageFile">
                            <div class="upload-container">
                                <div class="upload-header">
                                    <el-upload class="upload-demo" :auto-upload="false" :on-change="handleUploadChange"
                                        :on-remove="handleRemove" :on-preview="handlePreview" :file-list="fileList"
                                        list-type="picture" accept="image/*" multiple>
                                        <el-button type="primary" plain>点击上传（支持多选）</el-button>
                                    </el-upload>
                                    <!-- 操作按钮组 -->
                                    <div class="action-buttons">
                                        <el-button type="primary" @click="handleUpload" :disabled="!canUpload"
                                            :loading="uploading" class="upload-btn" size="large">
                                            {{ uploading ? `上传中 (${currentUploadIndex + 1}/${fileList.length})` : `上传图片`
                                            }}
                                        </el-button>
                                        <el-button @click="resetForm" class="reset-btn" size="large">重置</el-button>
                                    </div>
                                </div>

                                <!-- 批量操作按钮 -->
                                <div class="batch-actions" v-if="fileList.length > 0">
                                    <el-button type="danger" plain size="small" @click="clearAllFiles"
                                        :disabled="fileList.length === 0">
                                        清空列表
                                    </el-button>
                                    <span class="file-count">已选择 <strong style="color: #3498db;">{{ fileList.length
                                    }}</strong>
                                        个文件</span>
                                </div>
                            </div>
                        </el-form-item>
                    </div>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { ElMessage, type FormInstance, type FormRules, type UploadProps, type UploadUserFile } from "element-plus";
import { ImageType } from '../../data/ImageType';
import { db } from '../../db';
import { loadImagesFromDatabase } from '../../data/ImageInfo';

// 表单尺寸
const formSize = ref("default");

// 表单引用
const uploadForm = ref<FormInstance>();

// 表单数据
const formData = reactive({
    imageType: '',
});

// 验证规则 - 简化，只验证图片类型
const rules: FormRules = {
    imageType: [
        {
            required: true,
            message: '请选择图片类型',
            trigger: 'change'
        }
    ]
};

// 上传相关状态
const fileList = ref<UploadUserFile[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const currentUploadIndex = ref(0);
const uploadStatus = ref({
    message: '',
    success: false,
    error: false
});

// 过滤掉"全部"选项
const filteredImageTypes = computed(() => {
    return ImageType.filter(type => type !== '全部');
});

// 检查是否可以上传 - 简化逻辑
const canUpload = computed(() => {
    return formData.imageType && fileList.value.length > 0;
});

// 从文件名提取名称（不含扩展名）
const getFileNameWithoutExtension = (filename: string) => {
    return filename.split('.').slice(0, -1).join('.') || filename;
};

// 处理文件选择
const handleUploadChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
    fileList.value = uploadFiles;
    console.log(uploadFile);
    
    // 触发图片类型验证
    if (uploadForm.value) {
        uploadForm.value.validateField('imageType');
    }
};

// 处理文件移除
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
    fileList.value = uploadFiles;
    console.log(uploadFile);


    // if (uploadFiles.length === 0) {
    //     uploadStatus.value = {
    //         message: '已清除所有图片',
    //         success: false,
    //         error: false
    //     };
    // } else {
    //     uploadStatus.value = {
    //         message: `剩余 ${uploadFiles.length} 个文件`,
    //         success: false,
    //         error: false
    //     };
    // }
};

// 清空所有文件
const clearAllFiles = () => {
    fileList.value = [];
    // uploadStatus.value = {
    //     message: '已清空所有文件',
    //     success: false,
    //     error: false
    // };
};

// 处理图片预览
const handlePreview: UploadProps['onPreview'] = (file) => {
    if (file.url) {
        window.open(file.url, '_blank');
    }
};

// 上传单张图片到数据库
const uploadSingleImage = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const base64Data = e.target?.result as string;
                const fileName = getFileNameWithoutExtension(file.name);

                // 保存到数据库
                await db.images.add({
                    name: fileName,
                    type: formData.imageType,
                    data: base64Data,
                    filename: file.name,
                    uploadedAt: new Date()
                });

                resolve(true);
            } catch (error) {
                console.error(`图片 ${file.name} 上传失败:`, error);
                resolve(false);
            }
        };

        reader.onerror = () => {
            console.error(`文件 ${file.name} 读取失败`);
            resolve(false);
        };

        reader.readAsDataURL(file);
    });
};

// 批量上传图片到数据库
const handleUpload = async () => {
    // 验证表单
    if (!uploadForm.value) return;

    try {
        // 手动验证图片类型字段
        await uploadForm.value.validateField('imageType');

        // 检查是否有文件
        if (fileList.value.length === 0) {
            ElMessage.error('请选择图片文件');
            return;
        }

        uploading.value = true;
        uploadProgress.value = 0;
        currentUploadIndex.value = 0;

        let successCount = 0;
        let errorCount = 0;

        // 逐个上传文件
        for (let i = 0; i < fileList.value.length; i++) {
            currentUploadIndex.value = i;
            const uploadFile = fileList.value[i];
            const file = uploadFile?.raw as File;

            // 更新进度
            uploadProgress.value = Math.round((i / fileList.value.length) * 100);
            uploadStatus.value = {
                message: `正在上传: ${file.name}`,
                success: false,
                error: false
            };

            // 上传单张图片
            const success = await uploadSingleImage(file);

            if (success) {
                successCount++;
            } else {
                errorCount++;
                ElMessage.error(`图片 ${file.name} 上传失败`);
            }

            // 短暂延迟，避免界面卡顿
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 上传完成
        uploadProgress.value = 100;

        if (errorCount === 0) {
            // 全部成功
            uploadStatus.value = {
                message: `成功上传 ${successCount} 张图片！`,
                success: true,
                error: false
            };
            ElMessage.success(`成功上传 ${successCount} 张图片！`);
        } else if (successCount > 0) {
            // 部分成功
            uploadStatus.value = {
                message: `上传完成：成功 ${successCount} 张，失败 ${errorCount} 张`,
                success: false,
                error: true
            };
            ElMessage.warning(`上传完成：成功 ${successCount} 张，失败 ${errorCount} 张`);
        } else {
            // 全部失败
            uploadStatus.value = {
                message: `所有图片上传失败`,
                success: false,
                error: true
            };
            ElMessage.error('所有图片上传失败');
        }

        // 重新加载图片列表
        await loadImagesFromDatabase();

        // 重置表单（保留成功状态信息）
        setTimeout(() => {
            if (errorCount === 0) {
                resetForm();
            } else {
                // 如果有失败的文件，不清空列表，让用户可以重试
                uploading.value = false;
            }
        }, 2000);

    } catch (error) {
        console.error('上传过程出错:', error);
        uploadStatus.value = {
            message: `上传过程出错: ${error}`,
            success: false,
            error: true
        };
        ElMessage.error(`上传过程出错: ${error}`);
        uploading.value = false;
    }
};

// 重置表单
const resetForm = () => {
    // 重置表单数据
    formData.imageType = '';
    fileList.value = [];

    // 重置上传状态
    uploading.value = false;
    uploadProgress.value = 0;
    currentUploadIndex.value = 0;

    // 重置表单验证状态
    uploadForm.value?.resetFields();

    uploadStatus.value = {
        message: '',
        success: false,
        error: false
    };
};
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text {
    font-size: 22px;
    color: #3498db;
    font-weight: bold;
    font-family: "Courier New", Courier, monospace;
}

/* 表单内容布局 */
.form-content {
    display: flex;
    gap: 40px;
    align-items: flex-start;
}

.form-left {
    flex: 0 0 320px;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.form-right {
    flex: 1;
    min-width: 0;
}

/* 上传区域样式 */
.upload-info {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

/* 上传容器样式 */
.upload-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 100%;
}

/* 上传头部 - 按钮区域 */
.upload-header {
    display: flex;
    gap: 15px;
    align-items: flex-start;
    flex-wrap: wrap;
}

:deep(.upload-demo) {
    flex: 1;
    min-width: 300px;
}

/* 操作按钮组 */
.action-buttons {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.upload-btn {
    min-width: 120px;
    padding: 12px 20px;
    font-size: 16px;
}

.reset-btn {
    min-width: 80px;
    padding: 12px 20px;
    font-size: 16px;
}

/* 批量操作按钮 */
.batch-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.file-count {
    margin-left: auto;
    font-size: 14px;
    color: #666;
}

/* 上传进度 */
.upload-progress {
    padding: 10px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.progress-text {
    margin-top: 5px;
    font-size: 12px;
    color: #666;
    text-align: center;
}

/* 上传状态样式 */
.upload-status {
    padding: 10px 12px;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s;
    text-align: center;
}

.upload-status.success {
    background-color: #f0f9ff;
    color: #3498db;
    border: 1px solid #b3e19d;
}

.upload-status.error {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
}

/* 自定义上传组件样式 - 文件列表带滚动条 */
:deep(.upload-demo) {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

:deep(.upload-demo .el-upload) {
    width: 100%;
}

:deep(.el-upload-list--picture) {
    /* border: 1px solid #e8e8e8; */
    max-height: 250px;
    overflow-y: auto;
    border-radius: 8px;
    padding: 12px;
    /* background: #fafafa; */
    /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); */
}

:deep(.el-upload-list--picture .el-upload-list__item) {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
}

:deep(.el-upload-list--picture .el-upload-list__item:last-child) {
    margin-bottom: 0;
}

:deep(.el-upload-list--picture .el-upload-list__item:hover) {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

:deep(.el-upload-list--picture .el-upload-list__item-thumbnail) {
    width: 40px;
    height: 40px;
    object-fit: cover;
    margin-right: 10px;
    border-radius: 4px;
}

:deep(.el-upload-list--picture .el-upload-list__item-name) {
    flex-grow: 1;
    font-size: 14px;
    color: #333;
}

:deep(.el-upload-list--picture .el-upload-list__item-status-label) {
    margin-left: 10px;
}

:deep(.el-form-item__label) {
    font-weight: bold;
    font-size: 15px;
}

:deep(.el-form-item) {
    margin-bottom: 20px;
}

/* 滚动条样式 */
:deep(.el-upload-list--picture)::-webkit-scrollbar {
    width: 6px;
}

:deep(.el-upload-list--picture)::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

:deep(.el-upload-list--picture)::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

:deep(.el-upload-list--picture)::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 968px) {
    .form-content {
        flex-direction: column;
        gap: 25px;
    }

    .form-left {
        flex: none;
        width: 100%;
    }

    .form-right {
        width: 100%;
    }

    .upload-header {
        flex-direction: column;
    }

    .action-buttons {
        width: 100%;
        justify-content: center;
    }

    .upload-btn,
    .reset-btn {
        flex: 1;
    }
}

@media (max-width: 768px) {
    .batch-actions {
        flex-direction: column;
        align-items: flex-start;
    }

    .file-count {
        margin-left: 0;
    }

    .action-buttons {
        flex-direction: column;
    }

    .upload-btn,
    .reset-btn {
        width: 100%;
    }
}

:deep(.el-upload-list__item-file-name) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 175px; 
}
</style>