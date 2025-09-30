import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/ImageStitching",
  },
  {
    path: "/Home",
    name: "Home",
    component: () => import("../components/layout/layout.vue"),
    children: [
      {
        path: "/ImageStitching",
        name: "ImageStitching",
        meta: {
          title: "图片拼接",
          breadcrumb: ["图片拼接", "图片拼接"],
          keepAlive: true
        },
        component: () => import("../components/views/ImageStitching.vue"),
      },
      {
        path: "/ImageList",
        name: "ImageList",
        meta: {
          title: "图片列表",
          breadcrumb: ["图片列表", "图片列表"],
          keepAlive: true
        },
        component: () => import("../components/views/ImageList.vue"),
      },
      {
        path: "/UploadImage",
        name: "UploadImage",
        meta: {
          title: "上传图片",
          breadcrumb: ["上传图片", "上传图片"],
        },
        component: () => import("../components/views/UploadImage.vue"),
      },
    ]
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫 - 预加载优化
router.beforeEach((to, from, next) => {
  console.log("to",to);
  console.log("from",from);
  // 添加页面加载指示器
  const loadingEl = document.createElement('div');
  loadingEl.className = 'route-loading-indicator';
  loadingEl.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 3px; background: #409EFF; z-index: 9999;">
      <div style="width: 50%; height: 100%; background: #67C23A; animation: routeLoading 1.5s infinite;"></div>
    </div>
    <style>
      @keyframes routeLoading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    </style>
  `;
  document.body.appendChild(loadingEl);
  
  setTimeout(() => {
    const indicator = document.querySelector('.route-loading-indicator');
    if (indicator) {
      document.body.removeChild(indicator);
    }
  }, 500);
  
  next();
});

export default router;