<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ImageName } from "../data/ImageType";

interface ListItem {
    value: string
    label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string[]>([])
const loading = ref(false)

onMounted(() => {
    list.value = ImageName.map((item) => {
        return { value: `value:${item}`, label: `${item}` }
    })
    options.value = list.value
})

const remoteMethod = (query: string) => {
    if (query) {
        loading.value = true
        setTimeout(() => {
            loading.value = false
            options.value = list.value.filter((item) => {
                return item.label.toLowerCase().includes(query.toLowerCase())
            })
        }, 200)
    } else {
        options.value = []
    }
}

</script>

<template>
    <div class="container">
        <div class="top-section">
            <div class="left-section">
                <div class="control-header">
                    <el-select v-model="value" clearable placeholder="请选择" size="large">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                    <el-select v-model="value" size="large" multiple filterable remote reserve-keyword clearable
                        placeholder="输入查询" :remote-method="remoteMethod" :loading="loading">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </div>
                <div class="stats-container">
                    
                    
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stats-more {
    color: var(--primary-color);
    font-weight: 600;
}

.stats-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.image-stats {
    padding: 0.75rem 1rem;
    background: var(--panel-background);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    margin-bottom: 0.5rem;
}

.control-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    width: 100%;
}

.selection-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    gap: 1rem;
}

.stats-container {
    margin-bottom: 1rem;
}

.left-section {
    background: var(--section-background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.top-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    height: 100%;
    min-height: 0;
}

.container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    height: 100vh;
    background-color: var(--background-color);
    overflow: hidden;
}

/* .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
} */

.text {
    font-size: 14px;
}

.item {
    margin-bottom: 18px;
}

.box-card {
    width: 480px;
}

/* .nav-aside {
    background: var(--section-background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
} */
</style>
