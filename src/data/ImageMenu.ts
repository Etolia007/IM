import { Connection, Picture, List, UploadFilled } from "@element-plus/icons-vue";

interface INavMenu {
  //定义接口
  name: string;
  url: string;
  icon: any; //可选属性
  children?: any;
}

export const ImageMenu = () => {
  const menuItems: INavMenu[] = [
    { name: "图片拼接", url: "/ImageStitching", icon: Connection },
    { name: "管理界面", url: "/ImageManage", icon: Picture ,
      children: [
        { name: "图片列表", url: "/ImageList", icon: List },
        { name: "上传图片", url: "/UploadImage", icon: UploadFilled },
      ],
    },
  ];
  return {
    menuItems,
  };
};
