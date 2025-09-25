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
        },
        component: () => import("../views/ImageStitching.vue"),
      },
      {
        path: "/ImageManage",
        name: "ImageManage",
        meta: {
          title: "图片管理",
          breadcrumb: ["图片管理", "图片管理"],
        },
        component: () => import("../views/ImageManage.vue"),
      },
    ]
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
