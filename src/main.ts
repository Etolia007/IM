import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import router from "./router";
import vuedraggable from 'vuedraggable';
// ElMessage容易失效的解决方法：
import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-message-box.css";

const app = createApp(App);
app.component('draggable', vuedraggable);
app.use(router);
app.mount("#app");
