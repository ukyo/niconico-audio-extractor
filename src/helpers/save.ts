import { IMedia } from "../interfaces";

export const save = (media: IMedia) => {
  const a = <HTMLAnchorElement>document.createElement("a");
  const e = <MouseEvent>document.createEvent("MouseEvent");

  const objUrl = URL.createObjectURL(new Blob([media.data]));
  a.setAttribute("download", media.name + "." + media.type);
  a.setAttribute("href", objUrl);
  e.initEvent("click", true, true);
  a.dispatchEvent(e);
  URL.revokeObjectURL(objUrl);
};
