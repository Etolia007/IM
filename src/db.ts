import Dexie from 'dexie';

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

export const db = new ImageDatabase();
export type { Image };