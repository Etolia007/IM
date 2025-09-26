<script setup lang="ts">
import { ImageMenu } from '../../data/ImageMenu'
import { ref } from 'vue';
import { Fold, Expand } from '@element-plus/icons-vue'

//菜单项
const { menuItems } = ImageMenu()

// 折叠栏
const isCollapse = ref(false)   //false:默认展开侧边栏，true：默认关闭侧边栏
const show = ref(true)  //图标切换flag
const open = () => {
    isCollapse.value = !isCollapse.value
    show.value = !show.value
}
const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<template>
    <div class="demo">
        <el-aside width="width" class="aside">
            <div class="menu-container">
                <div id="title">
                    <h2 id="directory">{{ isCollapse ? '' : '菜单栏' }}</h2>
                    <h2 id="icon">
                        <el-icon size="large" @click="open">
                            <component :is="isCollapse ? Expand : Fold" />
                        </el-icon>
                    </h2>
                </div>
            </div>

            <el-menu :default-active="$route.path" class="el-menu-vertical-demo" router :collapse="isCollapse"
                @open="handleOpen" @close="handleClose" active-text-color="#376FDE">
                <template v-for="(menuItem, index) in menuItems">
                    <el-sub-menu v-if="menuItem.children" :key="index" :index="menuItem.url">
                        <template #title>&nbsp;
                            <el-icon>
                                <Icons :icon="menuItem.icon" />
                            </el-icon>
                            <span>{{ menuItem.name }}</span>
                        </template>
                        <el-menu-item v-for="(childItem, childIndex) in menuItem.children" :key="childIndex"
                            :index="childItem.url">&nbsp;
                            <el-icon>
                                <Icons :icon="childItem.icon" />
                            </el-icon>
                            <span>{{ childItem.name }}</span>
                        </el-menu-item>
                    </el-sub-menu>
                    <el-menu-item v-else :index="menuItem.url">&nbsp;
                        <el-icon>
                            <Icons :icon="menuItem.icon" />
                        </el-icon>
                        <span>{{ menuItem.name }}</span>
                    </el-menu-item>
                </template>
            </el-menu>
        </el-aside>
    </div>
</template>

<style scoped>
.menu-container {
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.el-menu {
    border-right: solid 0px var(--el-menu-border-color)
}

#title {
    display: flex;
    justify-content: space-between; /* 改为更合适的对齐方式 */
    align-items: center;
    padding: 10px 15px;
}
#directory {
    font-size: 18px;
    font-weight: 600;
    transition: all 0.3s ease;
}
#icon {
    margin: 0;
}

.el-icon {
    cursor: pointer;
    transition: all 0.3s ease;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
}
</style>
