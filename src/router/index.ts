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
        component: () => import("../components/views/ImageStitching.vue"),
      },
      {
        path: "/ImageList",
        name: "ImageList",
        meta: {
          title: "图片列表",
          breadcrumb: ["图片列表", "图片列表"],
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

export default router;
