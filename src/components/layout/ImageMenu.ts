import { Connection, Picture } from "@element-plus/icons-vue";

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
    { name: "图片管理", url: "/ImageManage", icon: Picture },
  ];
  return {
    menuItems,
  };
};
