import { ref } from "vue";

export const ImageInfo = ref([
    { id: 1, name:1,type: '刀锋副武器', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 2, type: '刀锋副武器', url: new URL('.././assets/image/sgyy.jpg', import.meta.url).href, },
    { id: 3, type: '刀锋武器', url: new URL('.././assets/image/agzz.jpg', import.meta.url).href, },
    { id: 4, type: '刀锋武器', url: new URL('.././assets/image/cljs.jpg', import.meta.url).href, },
    { id: 5, type: '刀锋武器', url: new URL('.././assets/image/dmbj.jpg', import.meta.url).href, },
    { id: 6, type: '刀锋武器', url: new URL('.././assets/image/gqwy.jpg', import.meta.url).href, },
    { id: 7, type: '刀锋武器', url: new URL('.././assets/image/hlm.jpg', import.meta.url).href, },
    { id: 8, type: '刀锋武器', url: new URL('.././assets/image/kb.jpg', import.meta.url).href, },
    { id: 9, type: '刀锋武器', url: new URL('.././assets/image/lldq.jpg', import.meta.url).href, },
    { id: 10, type: '刀锋皮肤', url: new URL('.././assets/image/shz.jpg', import.meta.url).href, },
    { id: 11, type: '刀锋皮肤', url: new URL('.././assets/image/st.jpg', import.meta.url).href, },
    { id: 12, type: '刀锋皮肤', url: new URL('.././assets/image/xyj.jpg', import.meta.url).href, },
    { id: 13, type: '刀锋皮肤', url: new URL('.././assets/image/xlx.jpg', import.meta.url).href, },
    { id: 14, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 15, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 16, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 17, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 18, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 19, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 20, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 21, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 22, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 23, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 24, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
    { id: 25, type: '刀锋皮肤', url: new URL('.././assets/image/atsth.jpg', import.meta.url).href, },
].map(item => {
    // 安全的提取文件名方法
    const url = item.url || '';
    const fileName = url.split('/').pop()?.split('.')[0] || `图片${item.id}`;
    
    return {
        ...item,
        name: fileName
    };
}));

export function generateSmallImages() {
    return ImageInfo.value.map(item => {
        // 根据原图名称生成小图路径
        return item.url
    });
}

export const smallImages = generateSmallImages();