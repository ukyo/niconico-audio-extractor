import { IMedia } from "./interfaces";

window.onload = e => {
  chrome.runtime.getBackgroundPage((_?: Window) => {
    var bg = (<any>_).Background;
    var progressBar = <HTMLProgressElement>document.querySelector("progress");
    var progressInfo = document.getElementById("info");
    var pageTitle = bg["pageTitle"];

    (bg["downloadType"] === "movie" ? bg.getMovie : bg.getAudio)({
      pageTitle: bg["pageTitle"],
      pageUrl: bg["pageUrl"],
      xhrSuccess: movie => {
        progressBar.value = 100;
        progressInfo.innerText = "Complete!";
        return movie;
      },
      xhrFail: e => {
        progressInfo.innerText = "Error: " + (<XMLHttpRequest>e.target).status;
        return e;
      },
      xhrProgress: e => {
        if (e.loaded === e.total) return;
        progressBar.value = Math.floor((e.loaded / e.total) * 100);
        progressInfo.innerText = "Now Loading... " + progressBar.value + "%";
      }
    })
      // save file.
      .then((media: IMedia) => {
        var a = <HTMLAnchorElement>document.createElement("a");
        var e = <MouseEvent>document.createEvent("MouseEvent");

        a.setAttribute("download", media.name + "." + media.type);
        a.setAttribute("href", URL.createObjectURL(new Blob([media.data])));
        e.initEvent("click", true, true);
        a.dispatchEvent(e);
      })
      .catch(e => {
        progressInfo.innerText = "Error: " + e.message;
      });
  });
};
