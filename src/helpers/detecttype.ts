import { Mp4 } from "../../vendor/mp4.js/dist";

export const detectType = (movie: Uint8Array): string => {
  var view = new Mp4.DataView2(movie);

  if (view.getString(4, 4) === "ftyp") {
    return "mp4";
  } else {
    switch (view.getString(0, 3)) {
      case "FWS":
      case "CWS":
        return "swf";
      case "FLV":
        return "flv";
    }
  }
};
