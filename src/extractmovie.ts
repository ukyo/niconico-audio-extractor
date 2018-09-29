import { download, downloadMovieForLoggedInUser } from "./helpers/download";
import { detectType } from "./helpers/detecttype";
import { VIDEO_TITLE_SAFIX } from "./settings";
import { save } from "./helpers/save";

(async () => {
  const movie = await downloadMovieForLoggedInUser();
  const media = {
    type: "mp4",
    data: movie,
    name: document.title.split(VIDEO_TITLE_SAFIX)[0]
  };
  save(media);
})();
