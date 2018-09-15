import "../vendor/zlib.js/bin/inflate.min";
import { IMedia } from "./interfaces";
import { detectType } from "./helpers/detecttype";
import * as Swf from "./swf";
import * as Flv from "./flv";
import { VIDEO_TITLE_SAFIX } from "./settings";
import { Mp4 } from "../vendor/mp4.js/dist";
import { download } from "./helpers/download";
import { save } from "./helpers/save";

const extractAudio = (movie: Uint8Array): IMedia => {
  var media: IMedia;

  switch (detectType(movie)) {
    case "swf":
      media = {
        type: "mp3",
        data: Swf.extractMp3(movie)
      };
      break;
    case "mp4":
      media = {
        type: "m4a",
        data: Mp4.extractAudio(movie)
      };
      break;
    case "flv":
      media = Flv.extractAudio(movie);
      break;
    default:
      throw new TypeError();
  }

  if (media.type === "aac") {
    media = {
      type: "m4a",
      data: Mp4.aacToM4a(media.data)
    };
  }

  return media;
};

(async () => {
  const movie = await download();
  const media = extractAudio(movie);
  media.name = document.title.split(VIDEO_TITLE_SAFIX)[0];
  save(media);
})();
