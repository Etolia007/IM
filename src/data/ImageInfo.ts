import { ref, computed } from "vue";
import { db, type Image } from "../db";

// 统一的数据存储
export const imageList = ref<Image[]>([]);

// 加载图片数据的函数
export async function loadImagesFromDatabase() {
  try {
    const imagesFromDb = await db.images.toArray();
    imageList.value = imagesFromDb;
    console.log("数据加载成功！", imagesFromDb.length);
  } catch (error) {
    console.error('从数据库加载图片失败:', error);
  }
}

// 计算属性：转换为组件需要的格式
export const ImageInfo = computed(() => {
  return imageList.value.map(image => ({
    id: image.id,
    name: image.name,
    type: image.type,
    data: image.data, // 使用 data 字段，与数据库一致
    filename: image.filename
  }));
});

// 小图生成函数
export function generateSmallImages() {
  return imageList.value.map(item => item.data);
}

export const smallImages = generateSmallImages();

// 初始化加载
loadImagesFromDatabase();