<script setup lang="ts">
import NavMenu from "./navMenu.vue"; //导航
import NavHead from "./navHead.vue"; //头部
import NavMain from "./navMain.vue"; //主体
// import BackTop from '../function/backTop.vue' //回顶

</script>

<template>
  <div class="app-main">

    <el-container>
      <!-- 左侧导航 -->
      <el-aside class="nav-menu" width="auto">
        <NavMenu />
      </el-aside>

      <!-- 右侧 -->
      <el-container>
        <!-- 头部 -->
        <el-header height="auto">
          <NavHead />
        </el-header>
        <!-- 主体 -->
        <el-main>

          <el-scrollbar wrap-class="app-main-scroll-wrap">
            <!-- <BackTop target=".app-main-scroll-wrap" /> -->
            <NavMain class="main" />
          </el-scrollbar>

        </el-main>
      </el-container>

    </el-container>

  </div>
</template>

<style scoped>
.nav-menu {
  border-right: 1px solid #ccc;
  /* background-color: #67C23A; */
}

.el-main {
  --el-main-padding: 10px 20px;
  color: #333;
  text-align: center;
  height: calc(100vh - 100px);
  background-color: #F5F5F5FF;
  /* height: 0;
  flex-grow: 1; */
  /* height: 450px;
  overflow: auto; */
}

.el-header {
  border-bottom: 1px solid #dcdfe6;
  padding: 1px 20px;
}
</style>
