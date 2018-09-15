const container = document.createElement("div");
container.style.position = "fixed";
container.style.right = "0px";
container.style.bottom = "0px";
container.style.width = "240px";
container.style.backgroundColor = "#fff";
container.style.zIndex = "10000000000";
container.style.transform = "translateX(100%)";
container.style.transition = "transform 0.25s";
container.style.boxShadow = "0 0 5px rgba(0,0,0,.2)";

const progressBar = document.createElement("div");
progressBar.style.height = "3px";
progressBar.style.width = "0%";
progressBar.style.backgroundColor = "rgb(90, 185, 241)";

const messageBox = document.createElement("div");
messageBox.style.width = "100%";
messageBox.style.padding = "10px 5px";
messageBox.style.fontSize = "12px";
messageBox.style.color = "#494949";

const closeBtn = document.createElement("div");
closeBtn.textContent = "×";
closeBtn.style.position = "absolute";
closeBtn.style.right = "10px";
closeBtn.style.bottom = "5px";
closeBtn.style.fontSize = "20px";
closeBtn.style.cursor = "pointer";

container.appendChild(progressBar);
container.appendChild(messageBox);
document.body.appendChild(container);

export const download = () => {
  return new Promise<Uint8Array>((resolve, reject) => {
    (window as any).requestIdleCallback(async () => {
      container.style.transform = "translateX(0%)";

      const request = () => {
        return new Promise((_, reject) => {
          const url = (document.querySelector(
            "#MainVideoPlayer video"
          ) as HTMLVideoElement).src;
          const xhr = new XMLHttpRequest();
          xhr.responseType = "arraybuffer";
          xhr.open("GET", url);
          xhr.send();
          xhr.onprogress = e => {
            if (e.loaded === e.total) return;
            const r = Math.floor((e.loaded / e.total) * 100);
            progressBar.style.width = r + "%";
            messageBox.textContent = `Now Loading... ${r}%. Do not close!`;
          };
          xhr.onloadend = () => {
            if (200 <= xhr.status && xhr.status < 300) {
              const movie = new Uint8Array(xhr.response);
              progressBar.style.width = "100%";
              messageBox.textContent = "Complete!";
              resolve(movie);
              setTimeout(() => container.remove(), 2000);
            } else {
              reject(new Error(`Error: ${xhr.status}`));
            }
          };
        });
      };

      for (let i = 3; i >= 0; i--) {
        try {
          await request();
          return;
        } catch (e) {
          if (i === 0) {
            messageBox.textContent = e.message;
            container.appendChild(closeBtn);
            closeBtn.onclick = () => container.remove();
            reject();
          }
        }
      }
    });
  });
};
