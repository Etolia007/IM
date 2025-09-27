import { ref } from "vue";
import { db } from "../db";

// 创建一个响应式的图片列表，初始为空
export const ImageInfo = ref<Array<{id?: number, name: string, type: string, url: string}>>([]);

// 从数据库加载图片数据的函数
async function loadImagesFromDatabase() {
  try {
    const imagesFromDb = await db.images.toArray();
    // 将数据库中的数据转换为ImageInfo所需的格式
    ImageInfo.value = imagesFromDb.map(image => ({
      id: image.id,
      name: image.name,
      type: image.type,
      url: image.data // 数据库中的data字段就是base64格式的图片数据
    }));
    console.log("数据加载成功！");
  } catch (error) {
    console.error('从数据库加载图片失败:', error);
  }
}

loadImagesFromDatabase();

// 导出加载函数，以便在其他地方手动调用
export { loadImagesFromDatabase };

// 小图生成函数（根据需求调整）
export function generateSmallImages() {
  return ImageInfo.value.map(item => item.url);
}

export const smallImages = generateSmallImages();