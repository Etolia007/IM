import Dexie from 'dexie';
import { ref } from 'vue';

interface Image {
  id?: number;
  name: string;
  type: string;
  data: string; // base64格式的图片数据
  filename: string;
  uploadedAt: Date;
}

export class ImageDatabase extends Dexie {
  images: Dexie.Table<Image, number>;

  constructor() {
    super('ImageDatabase');
    
    this.version(1).stores({
      images: '++id, name, type, filename, uploadedAt'
    });
    
    this.images = this.table('images');
  }
}

// 加载图片列表
const images = ref<Image[]>([]);
const loadImages = async () => {
    try {
        images.value = await db.images.toArray();
    } catch (error) {
        console.error('加载图片失败:', error);
    }
};

export{loadImages,images};
export const db = new ImageDatabase();
export type { Image };