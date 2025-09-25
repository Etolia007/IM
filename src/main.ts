import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import router from "./router";
import vuedraggable from 'vuedraggable';


const app = createApp(App);
app.component('draggable', vuedraggable);
app.use(router);
app.mount("#app");
